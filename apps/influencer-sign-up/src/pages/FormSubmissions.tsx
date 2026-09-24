import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import { ArrowLeft, Download, Inbox } from 'lucide-react';
import { getForm, getSubmissions, GetFormOutputType, GetSubmissionsOutputType } from '@/lib/api';
import { format } from 'date-fns';
import {
  useReactTable, getCoreRowModel, getPaginationRowModel,
  getSortedRowModel, flexRender, type ColumnDef, type SortingState,
} from '@tanstack/react-table';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@project/components/ui/table';

type FormData = NonNullable<GetFormOutputType['form']>;
type Sub = GetSubmissionsOutputType['submissions'][0];

export default function FormSubmissions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData | null>(null);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([getForm({ id }), getSubmissions({ formId: id })]).then(([f, s]) => {
      setForm(f.form as FormData);
      setSubs(s.submissions);
      setLoading(false);
    });
  }, [id]);

  const fieldLabels = useMemo(() => {
    if (!form) return [];
    return (form.fields as any[]).map((f: any) => ({ id: f.id, label: f.label }));
  }, [form]);

  const columns = useMemo<ColumnDef<Sub>[]>(() => {
    const cols: ColumnDef<Sub>[] = [
      {
        accessorKey: 'submittedAt',
        header: 'Submitted',
        cell: ({ getValue }) => {
          const v = getValue() as string;
          return v ? format(new Date(v), 'MMM d, yyyy h:mm a') : '-';
        },
      },
      {
        accessorKey: 'submitterEmail',
        header: 'Email',
        cell: ({ getValue }) => (getValue() as string) || '-',
      },
    ];
    fieldLabels.forEach(({ id, label }) => {
      cols.push({
        id,
        header: label,
        cell: ({ row }) => {
          const val = row.original.responses[id];
          if (Array.isArray(val)) return val.join(', ');
          return val?.toString() || '-';
        },
      });
    });
    return cols;
  }, [fieldLabels]);

  const table = useReactTable({
    data: subs,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const exportCsv = () => {
    if (!form) return;
    const headers = ['Submitted', 'Email', ...fieldLabels.map(f => f.label)];
    const rows = subs.map(s => [
      s.submittedAt ? format(new Date(s.submittedAt), 'yyyy-MM-dd HH:mm') : '',
      s.submitterEmail,
      ...fieldLabels.map(f => {
        const v = s.responses[f.id];
        return Array.isArray(v) ? v.join('; ') : v?.toString() || '';
      }),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.title}-submissions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="font-semibold truncate">{form?.title} — Submissions</h1>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={subs.length === 0} className="gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {subs.length === 0 ? (
          <div className="text-center py-20">
            <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-1">No submissions yet</h2>
            <p className="text-muted-foreground text-sm">Share your form to start collecting responses.</p>
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(hg => (
                  <TableRow key={hg.id}>
                    {hg.headers.map(h => (
                      <TableHead
                        key={h.id}
                        className="cursor-pointer select-none whitespace-nowrap"
                        onClick={h.column.getToggleSortingHandler()}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {h.column.getIsSorted() === 'asc' ? ' ↑' : h.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map(row => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="max-w-[200px] truncate">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {table.getPageCount() > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
