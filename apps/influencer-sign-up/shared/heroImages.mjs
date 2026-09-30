// Single source of truth for hero photography.
//
// The builder and the server each used to keep their own copy of this list, and they
// drifted: the hosted URLs carried different org ids. A hero picked in the builder then
// failed the server's allow-list check and was silently replaced with a random one.
// Both sides import this file so that cannot happen again.

export const HERO_IMAGES = [
  'https://images.fillout.com/orgid-616887/flowpublicid-7ksdzxvvc1/widgetid-default/s9wMadXfeYFPAp7MyaEAgr/pasted-image-1782902048664-tp5ozxot.jpg',
  'https://images.fillout.com/orgid-616887/flowpublicid-7ksdzxvvc1/widgetid-default/cJjjjDeBebwXRDrFVfFJaK/pasted-image-1782902048703-ofe6memh.jpg',
  'https://images.fillout.com/orgid-616887/flowpublicid-7ksdzxvvc1/widgetid-default/mmUCR2FxaR9Fb3jCAhurPv/pasted-image-1782902048717-7wv8yd0j.jpg',
  'https://images.fillout.com/orgid-616887/flowpublicid-7ksdzxvvc1/widgetid-default/u9jU9DNCjvonekiUXxBbJH/pasted-image-1782902048729-6njfv4g9.jpg',
  'https://images.fillout.com/orgid-616887/flowpublicid-7ksdzxvvc1/widgetid-default/oMkb6DjugzjG797U55LBVM/pasted-image-1782902048752-etw407bk.jpg',
  'https://images.fillout.com/orgid-616887/flowpublicid-7ksdzxvvc1/widgetid-default/58qNnJL3EL4MF62HQEs6yA/pasted-image-1782902048768-i04s9o55.jpg',
  'https://images.fillout.com/orgid-616887/flowpublicid-7ksdzxvvc1/widgetid-default/61eCRLbFKFPwoowdwvvaH2/pasted-image-1782902048789-09kcsqk1.jpg',
  'https://images.fillout.com/orgid-616887/flowpublicid-7ksdzxvvc1/widgetid-default/n3WfwNPSpc7hXetukVhWZc/pasted-image-1782902048806-m84p5gkd.jpg',
  'https://images.fillout.com/orgid-616887/flowpublicid-7ksdzxvvc1/widgetid-default/hE8EfAKjgiatvJCWPRN311/pasted-image-1782902134354-vxs5bt0r.jpg',
  '/Heroes/opt/barre.jpg',
  '/Heroes/opt/barre1.jpg',
  '/Heroes/opt/barre3.jpg',
  '/Heroes/opt/cycle.jpg',
  '/Heroes/opt/cycle1.jpg',
  '/Heroes/opt/cycle3.jpg',
  '/Heroes/opt/strength.jpg',
  '/Heroes/opt/strength9.jpg',
  '/Heroes/opt/kids.jpg',
  '/Heroes/opt/kids1.jpg',
  '/Heroes/opt/kids2.jpg',
  '/Heroes/opt/kids4.jpg'
];

// Indexes into HERO_IMAGES, by the class format each photo shows.
export const FORMAT_HERO_INDEXES = {
  Barre: [1, 2, 8, 9, 10, 11],
  'Strength Lab': [3, 4, 5, 6, 15, 16],
  powerCycle: [0, 7, 12, 13, 14],
};

// Juniors photography; the adult pools exclude these.
export const KIDS_HERO_INDEXES = [17, 18, 19, 20];
