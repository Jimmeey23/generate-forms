// Ported verbatim from the one-click-signup reference site (src/lib/legal-content.ts).
export type LegalSection = {
  title?: string;
  paragraphs: string[];
};

export type LegalDocument = {
  title: string;
  subtitle: string;
  updated: string;
  sections: LegalSection[];
};

const businessIntro = [
  "Host: Physique 57 Mumbai",
  "Business: AMP Fitness LLP",
  "Address: Kwality House, 2nd Floor, August Kranti Marg, Kemps Corner, Mumbai - 400036",
  "Tax ID: 27ABGFA3922Q1Z2",
];

const releaseAndIndemnity = [
  'In connection with my enrolment and participation in the exercise class / program organised by AMP Fitness, LLP ("AMP") and use of the property, facilities and services provided to me by AMP ("Program"), I hereby, on behalf myself and my relatives, heirs, successors, executors and administrators, indemnify and agree to release, waive, discharge and agree and covenant to indemnify, release, waive, discharge and not to sue AMP, its designated partners, other partners, shareholders, directors, subsidiaries, affiliates, its and their licensees, licensors, successors, assigns, employees, officers, directors, consultants, service providers, agents, and contractors, and all persons, corporations, partnerships and other entities with which these entities may have become affiliated or may otherwise have dealings with at any time in the future, from any and all liability, claims, demands, actions and causes of action whatsoever arising out of or relating to any loss, expense, damages, injury, illnesses, diseases, disorders, conditions, disablement (whether partial, total, permanent or temporary), grievous bodily injury including death, that may be sustained by me, or to any property belonging to me, whether directly or indirectly caused to me by any person and on account of any reason whatsoever, whether by reason of due to my acts or omissions or by AMP or any of its instructors / operators, or otherwise as a result of participating in the Program.',
  "I am voluntarily participating in the Program with full knowledge, understanding and appreciation of the risks inherent in any physical exercise and expressly assume all risks of injury, illnesses, diseases, disorders, conditions and even partial or permanent disablement and/or death which could occur by reason of my participation.",
  "I have disclosed all relevant information regarding my physical, medical, emotional or mental conditions that could cause harm to me or others by participating in this Program and I hereby expressly declare, confirm and state that I have neither at any time suffered nor currently suffer nor am I susceptible to suffering any form of health condition which prevents or could prevent me, in any manner whatsoever, from participating in the Program in the manner as required by AMP.",
  "I am executing this Release cum Indemnity Agreement after having viewed or having had the opportunity to view the site of AMP's trial exercise classes; having reviewed the instructor's qualifications; having had the scope of AMP's classes and their associated risks fully explained to me; and after asking or having had an opportunity to ask questions regarding the classes and risks associated with AMP's exercise classes.",
  "I hereby further declare, confirm and state that I have all the requisite qualifications and minimum fitness requirements to enable me to participate in the Program. I agree that my safety is primarily my own responsibility. I agree to make sure that I know how to safely participate in the Program, and I agree to observe any and all rules, codes, guidelines, procedures, manuals and practices that may be required to minimize the risk of injuries, illnesses, diseases, disorders, conditions and even partial or permanent disablement and/or death whether or not such rules, codes, guidelines, procedures, manuals and practices are specifically and/or expressly conveyed to me.",
  "I acknowledge that I am fully aware and conversant with the precautions that I am required to take in connection with any and all physical activities whilst partaking in the activities forming a part of the Program. I agree to stop and seek assistance if I do not believe I can safely continue with the activities involved in the Program, to limit my participation in the said Program to reflect my personal fitness level, and to refrain from any and all actions that would pose any form of hazard to myself or others in the Program.",
  'The services provided by AMP to me under the Program are on an "as is" basis, without warranty of any kind, either expressed or implied, including without limitation any warranty for information services, coaching, uninterrupted access, or products and services provided through or in connection with the Program.',
  "All personal property carried by me and brought to AMP's premises or the Program is brought at my sole risks and consequences and AMP shall not, in any manner whatsoever, be liable for any loss or damage caused to the same during the Program.",
];

const privacyConsent = [
  'I consent to AMP collecting, storing, possessing, dealing, disclosing, transferring and otherwise handling my personal information including sensitive personal data or information ("personal information") for the purposes of my participating in the Programs.',
  "I agree to the terms of AMP's Privacy Policy with regard to all matters pertaining to my personal information. I understand that personal information provided by me will be held confidential unless agreed otherwise in writing or as may be required by applicable law.",
  "Additionally, I understand that the use of technology is not always secure and I accept the risks involved in the transmission, exchange and storage of confidential and personal information in and through various electronic means, including but not limited to in the use of email, text, phones, video conferencing facilities and other technology.",
];

const jurisdiction = [
  "The terms of this Agreement are governed by the laws of India and shall be subject to the exclusive jurisdiction of the courts at Mumbai.",
  "Any dispute arising out of or in connection with this Agreement shall be referred to and finally resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996, and amendments thereto. The arbitration proceedings shall be conducted by a sole arbitrator to be mutually appointed by the parties. The seat, place and venue of the arbitration shall be Mumbai. The language of the arbitration shall be English only.",
  "This Release cum Indemnity Agreement shall be read in conjunction with the other application forms and documents executed between me and AMP in relation to the Program. By my signature, I acknowledge that I have read and fully understood and accept the terms of this Release cum Indemnity Agreement and represent and agree that my signature is freely and knowingly given.",
];

export const waiverDocument: LegalDocument = {
  title: "Waiver",
  subtitle: "Release cum Indemnity Agreement for Physique 57 Mumbai / AMP Fitness LLP.",
  updated: "Extracted from Waiver - 2025-03-18",
  sections: [
    { title: "Business Details", paragraphs: businessIntro },
    {
      title: "Age, Capacity, Health Declaration",
      paragraphs: [
        "I confirm and declare that I am an adult of at least 18 years of age or am represented by an adult parent or guardian of at least 18 years of age and competent to contract and participate in this exercise class / program.",
        "This informed consent is freely and voluntarily executed after fully understanding the contents thereof, not caused by coercion, undue influence, fraud, misinterpretation, or mistake and shall be binding upon me, my spouse, partner, parents / guardians, relatives, legal representatives, heirs, executors, administrators, successors and assignees.",
        "I confirm and declare that I am in adequate health to participate in any activities at the Studio(s) of AMP Fitness LLP and that I also do not have any illness, disease or other health condition which could potentially put me or anyone else at risk. I confirm and acknowledge that should this information or position change, it is my sole responsibility to promptly notify the instructors at the Studio(s) of AMP Fitness LLP.",
      ],
    },
    { title: "Release, Waiver, Assumption of Risk and Indemnity", paragraphs: releaseAndIndemnity },
    { title: "Personal Information Consent", paragraphs: privacyConsent },
    { title: "Governing Law and Dispute Resolution", paragraphs: jurisdiction },
    {
      title: "Class Policies",
      paragraphs: [
        "Any personal property brought to Classes is brought at your sole risk as to its theft, damage, or loss. You agree that Physique 57 is in no way responsible for the safekeeping of your personal belongings while you attend Classes or are otherwise at a Physique 57 location.",
        "All cancellations must be given in writing to info@physique57india.com 12 hours prior to the class booking. All cancellations outside of this time frame will be deducted from your class package.",
        "Clients will be unable to join a Full or Express Studio Barre Class 10 minutes past the scheduled start time; should this happen, this class will be deducted from your class package.",
        "Payments can be made online via our app, using a valid credit or debit card.",
        "All classes must be paid for in advance and are non-refundable.",
        "Clients can pre-register for class up to one hour prior to the scheduled class time in order to reserve their space in class.",
        "If the class is full, you will be placed on the waitlist; additions to the class from the waitlist will be on a first come, first served basis.",
        "Instructor requests will be subject to availability.",
        "Preferred date and class timings will be subject to availability.",
      ],
    },
  ],
};

export const membershipWaiverDocument: LegalDocument = {
  title: "Membership Waiver",
  subtitle:
    "Membership terms, release, privacy consent, and cancellation policies for Physique 57 Mumbai.",
  updated: "Extracted from Membership waiver - 2026-02-03",
  sections: [
    { title: "Business Details", paragraphs: businessIntro },
    {
      title: "Membership Access and Fees",
      paragraphs: [
        "In exchange for the Fees and during the Term of this agreement, you will have access to each Physique 57 location in Mumbai during regular studio hours and you will have the right to participate in instructional classes offered by the studio subject to availability. Services offered by the studio will include classes in the Physique 57 fitness technique.",
        "The Fees payable under the terms of this Agreement are for the period of time and are in no way related to your actual usage of the Studio facilities.",
        "For the avoidance of doubt, please note that you are not, under any circumstances whatsoever, entitled to receive a refund of the Fees or any part thereof, under this membership agreement.",
        "Physique 57 reserves the right to cancel this membership and terminate this agreement at any time in the event that the member engages in behaviour that is unsafe or objectionable to other members or Physique 57 Staff.",
        "You shall at all times comply with and be bound by the policies, rules and regulations of Physique 57, as framed and modified from time to time, in all matters, including relating to your access and use of Physique 57's facilities, equipment and generally in relation to the services being provided to you hereunder.",
      ],
    },
    {
      title: "Personal Property",
      paragraphs: [
        "Any personal property brought to a Physique 57 India Studio is brought at your sole risk as to its theft, damage, or loss. You agree that Physique 57 India is in no way responsible for the safekeeping of your personal belongings while you attend Classes or are otherwise at a Physique 57 location.",
      ],
    },
    { title: "Release, Waiver, Assumption of Risk and Indemnity", paragraphs: releaseAndIndemnity },
    { title: "Personal Information Consent", paragraphs: privacyConsent },
    { title: "Governing Law and Dispute Resolution", paragraphs: jurisdiction },
    {
      title: "Cancellation Policy",
      paragraphs: [
        "All cancellations must be given in writing to info@physique57india.com or via the Physique 57 India app at least 12 hours prior to the Scheduled Class Start time. All cancellations outside of this time frame will be deducted from your class package.",
        "Clients will be unable to join a Full Studio Barre class 10 minutes past the scheduled start time; should this happen, this class will be deducted from your class package.",
        "Clients will be unable to join an Express Studio Barre class past the scheduled start time; should this happen, this class will be deducted from your class package.",
        "Clients who have attended under 10 powerCycle classes will need to be at the Studio at least 15 minutes before the Scheduled Class Start time. Entry to the Studio will be permitted until 5 minutes before the class start time.",
        "Clients who have attended over 10 Physique 57 classes need to be at the Studio 10 minutes before class starts. Entry to the room will not be permitted once the class has begun.",
      ],
    },
  ],
};

const bengaluruBusinessIntro = ["Host: Physique 57 Bengaluru", "Business: AMP Fitness LLP"];

export const bengaluruWaiverDocument: LegalDocument = {
  title: "Waiver",
  subtitle: "Release cum Indemnity Agreement for Physique 57 Bengaluru / AMP Fitness LLP.",
  updated: "Waiver - Physique 57 Bengaluru",
  sections: [
    { title: "Business Details", paragraphs: bengaluruBusinessIntro },
    {
      title: "Age, Capacity, Health Declaration",
      paragraphs: [
        "I confirm that I am an adult of at least 18 years of age or am represented by an adult parent or guardian of at least 18 years of age and competent to contract and participate in this exercise class/ program. This informed consent is freely and voluntarily executed, not caused by coercion, undue influence, fraud, misinterpretation, or mistake and shall be binding upon me, my spouse, partner, parents, relatives, legal representatives, heirs, executors, administrators, successors and assignees.",
        "I confirm and certify that I am in adequate health to participate in any activities at the Studio(s) of AMP Fitness LLP and that I also do not have any illness, disease or other health condition which could potentially put anyone else at risk. I confirm and acknowledge that should this information or position change, it is my sole responsibility to promptly notify the instructors at the Studio(s) of AMP Fitness LLP.",
      ],
    },
    {
      title: "Personal Property",
      paragraphs: [
        "Any personal property brought to Classes is brought at your sole risk as to its theft, damage, or loss. You agree that Physique 57 is in no way responsible for the safekeeping of your personal belongings while you attend Classes or are otherwise at a Physique 57 location.",
      ],
    },
    {
      title: "Class Policies",
      paragraphs: [
        "All cancellations must be given in writing to info@physique57bengaluru.com 12 hours prior to the class booking. All cancellations outside of this time frame will be deducted from your class package.",
        "Clients will be unable to join a Full or Express Studio class 7-Minutes past the scheduled start time; should this happen, this class will be deducted from your class package.",
        "Payments can be made online via our app, using a valid credit or debit card.",
        "All classes, Memberships & Packages must be paid for in advance and are non-refundable.",
        "Clients can pre-register for class up to one hour prior to the scheduled class time in order to reserve their space in class.",
        "If the class is full, you will be placed on the waitlist; additions to the class from the waitlist will be on a first come, first served basis.",
        "Instructor requests will be subject to availability.",
        "Preferred date and class timings will be subject to availability.",
      ],
    },
  ],
};

export const bengaluruTermsDocument: LegalDocument = {
  title: "Terms and Conditions",
  subtitle: "Membership, cancellation, liability, and general terms for Physique 57 Bengaluru.",
  updated: "Terms and conditions - Physique 57 Bengaluru",
  sections: [
    { title: "Business Details", paragraphs: bengaluruBusinessIntro },
    {
      title: "Membership Access and Fees",
      paragraphs: [
        "In exchange for the Fees and during the Term of this agreement, you will have access to each Physique 57 location in Bengaluru during regular studio hours and you will have the right to participate in instructional classes offered by the studio subject to availability. Services offered by the studio will include classes in the Physique 57 ® fitness technique.",
        "The Fees payable under the terms of this Agreement are for the period of time and are in no way related to your actual usage of the Studio facilities.",
        "For the avoidance of doubt, please note that, you are not, under any circumstances whatsoever, entitled to receive a refund of the Fees or any part thereof, under this membership agreement.",
        "Physique 57 reserves the right to cancel this membership and terminate this agreement at any time in the event that the member engages in behaviour that is unsafe or objectionable to other members or Physique 57 Staff.",
        "You shall at all times comply with and be bound by the policies, rules and regulations of Physique 57, as framed and modified from time to time, in all matters, including relating to your access and use of Physique 57's facilities, equipment and generally in relation to the services being provided to you hereunder.",
      ],
    },
    {
      title: "Personal Property",
      paragraphs: [
        "Any personal property brought to a Physique 57 India Studio is brought at your sole risk as to its theft, damage, or loss. You agree that Physique 57 India is in no way responsible for the safekeeping of your personal belongings while you attend Classes or are otherwise at a Physique 57 location.",
      ],
    },
    {
      title: "Cancellation Policy",
      paragraphs: [
        "All cancellations must be given in writing to info@physique57bengaluru.com or via the Physique 57 India app atleast 12 hours prior to the Scheduled Class Start time. All cancellations outside of this time frame will be deducted from your class package.",
        "Clients will be unable to join a Full Studio class 10-Minutes past the scheduled start time; should this happen, this class will be deducted from your class package.",
        "Clients will be unable to join an Express Studio class 7-Minutes past the scheduled start time; should this happen, this class will be deducted from your class package.",
        "Clients will be unable to join a 30 minute Studio Class after the Scheduled Start Time.",
      ],
    },
    {
      title: "Liability Waiver",
      paragraphs: [
        "I confirm that I am an adult of at least 18 years of age or am represented by an adult parent or guardian of at least 18 years of age and competent to contract and participate in this exercise class/ program. This informed consent is freely and voluntarily executed, not caused by coercion, undue influence, fraud, misinterpretation, or mistake and shall be binding upon me, my spouse, partner, parents, relatives, legal representatives, heirs, executors, administrators, successors and assignees. I confirm and certify that I am in adequate health to participate in any activities at the Studio(s) of AMP Fitness LLP and that I also do not have any illness, disease or other health condition which could potentially put anyone else at risk. I confirm and acknowledge that should this information or position change, it is my sole responsibility to promptly notify the instructors at the Studio(s) of AMP Fitness LLP.",
        "Any personal property brought to Classes is brought at your sole risk as to its theft, damage, or loss. You agree that Physique 57 is in no way responsible for the safekeeping of your personal belongings while you attend Classes or are otherwise at a Physique 57 location.",
      ],
    },
    {
      title: "General T&C's",
      paragraphs: [
        "All classes, memberships & Packages must be paid for in advance and are non-refundable.",
        "Clients can pre-register for class up to one hour prior to the scheduled class time in order to reserve their space in class.",
        "If the class is full, you will be placed on the waitlist; additions to the class from the waitlist will be on a first come, first served basis.",
        "Instructor requests will be subject to availability.",
        "Preferred date and class timings will be subject to availability.",
      ],
    },
  ],
};

export const privacyDocument: LegalDocument = {
  title: "Privacy Policy",
  subtitle:
    "Personal information consent terms from the attached Physique 57 Mumbai waiver documents.",
  updated: "Extracted from attached waiver documents",
  sections: [
    { title: "Business Details", paragraphs: businessIntro },
    { title: "Personal Information Consent", paragraphs: privacyConsent },
    { title: "Governing Law and Related Terms", paragraphs: jurisdiction },
  ],
};

export const termsDocument: LegalDocument = {
  title: "Terms and Conditions",
  subtitle:
    "Studio access, booking, cancellation, conduct, payment, and liability terms for Physique 57 India.",
  updated: "Aligned with Physique 57 India policy and waiver content",
  sections: [
    { title: "Business Details", paragraphs: businessIntro },
    {
      title: "Studio Access and Class Booking",
      paragraphs: [
        "Access to each class is strictly limited to available barre spots. Arriving without a prior booking is strongly discouraged.",
        "Clients can pre-register for class up to one hour prior to the scheduled class time in order to reserve their space in class.",
        "Preferred dates, class timings, and instructor requests are subject to availability.",
        "If a class is full, clients may be placed on the waitlist. Additions from the waitlist are handled on a first come, first served basis.",
      ],
    },
    {
      title: "Payment, Packages, and Memberships",
      paragraphs: [
        "All classes must be paid for in advance and are non-refundable.",
        "Single classes, class packages, unlimited memberships, workshops, special promotions, and memberships are strictly non-refundable and non-transferable.",
        "Unlimited memberships and class packages may not be shared between clients.",
        "The fees payable under a membership are for the membership period and are not related to actual usage of studio facilities.",
      ],
    },
    {
      title: "Cancellation and Late Cancellation",
      paragraphs: [
        "All cancellations for Studio Classes must be informed to the team via email, WhatsApp, or directly through the Physique 57 App at least 12 hours prior to the scheduled class start time.",
        "If a reservation is not cancelled within the required cancellation window, the reservation will be treated as a late cancellation.",
        "If a reservation under a single class or class package is not cancelled within the required cancellation window, the class will be deducted from the applicable package.",
        "Members on unlimited memberships are permitted a maximum of two late cancellations per calendar week. Upon a third late cancellation within the same calendar week, advance booking privileges may be suspended for seven days.",
      ],
    },
    {
      title: "Late Entry and Class Readiness",
      paragraphs: [
        "Physique 57 enforces a strict late entry policy to maintain class safety, structure, instructor flow, and the overall client experience.",
        "Members will ordinarily not be permitted entry into a class after 10 minutes from the scheduled class start time.",
        "For powerCycle, new clients with fewer than 10 classes must arrive 15 minutes before class for a safety briefing and custom bike fit. Entry is subject to studio discretion and operational feasibility.",
        "For express-format classes, entry will not be permitted once the class has commenced, and no grace period shall apply.",
      ],
    },
    {
      title: "Health, Safety, and Conduct",
      paragraphs: [
        "Clients are responsible for ensuring they are in adequate health to participate in classes and must promptly notify instructors if their health position changes.",
        "Clients agree to observe studio rules, codes, guidelines, procedures, and instructor directions intended to minimize risk and maintain a safe class environment.",
        "Physique 57 reserves the right to cancel a membership or restrict access if a member engages in unsafe or objectionable behaviour toward staff, instructors, or other members.",
      ],
    },
    { title: "Liability, Personal Property, and Privacy", paragraphs: releaseAndIndemnity },
    { title: "Personal Information Consent", paragraphs: privacyConsent },
    { title: "Governing Law and Dispute Resolution", paragraphs: jurisdiction },
  ],
};

// Juniors child booking waiver. Parent/guardian framing of the same release, health,
// privacy and class-policy clauses, matching the consent document parents sign on the
// paid-trial Juniors form.
export const kidsWaiverDocument: LegalDocument = {
  title: "Child Booking Waiver",
  subtitle: "Physique 57 Juniors parent/guardian waiver, privacy consent, and class policy terms.",
  updated: "Child booking waiver - Physique 57 Juniors",
  sections: [
    { title: "Business Details", paragraphs: businessIntro },
    {
      title: "Release and Health Declaration",
      paragraphs: [
        "I confirm and declare that I am at least eighteen (18) years of age and am the parent or legal guardian of the child named on this registration, competent to enter into this Agreement on the child's behalf. I further confirm that this informed consent is executed freely and voluntarily, with full understanding of its contents, and is not the result of coercion, undue influence, fraud, misrepresentation, or mistake. This Agreement shall be binding upon me, the child, and our spouses, partners, parents, guardians, relatives, legal representatives, heirs, executors, administrators, successors, and assigns.",
        'I confirm and declare that the child is in adequate physical and mental health to participate in the exercise classes, programs, and activities conducted by Physique 57 India and/or AMP Fitness LLP ("AMP"), and that the child does not suffer from any illness, injury, disease, disorder, condition, or other health concern that may place the child or any other person at risk. I acknowledge that should the child\'s health condition change at any time, it shall be my sole responsibility to promptly notify the instructors and staff of AMP.',
        'In consideration of the child\'s enrolment and participation in any exercise class, fitness program, activity, service, or facility provided by AMP (collectively referred to as the "Program"), I hereby, on behalf of myself, the child, and our heirs, successors, executors, administrators, and legal representatives, irrevocably release, waive, discharge, and covenant not to sue AMP, its partners, directors, shareholders, affiliates, subsidiaries, licensors, licensees, employees, officers, consultants, contractors, agents, service providers, successors, and assigns (collectively, the "Released Parties") from any and all claims, liabilities, demands, actions, causes of action, losses, damages, costs, expenses, injuries, illnesses, diseases, disorders, conditions, disabilities, or death arising out of or in any way connected with the child\'s participation in the Program.',
        "I further agree to indemnify, defend, and hold harmless the Released Parties from and against any and all claims, liabilities, losses, damages, costs, expenses, or demands arising from or relating to the child's participation in the Program or any breach of my obligations under this Agreement.",
      ],
    },
    {
      title: "Assumption of Risk and Safety",
      paragraphs: [
        "I acknowledge and understand that participation in physical exercise and fitness activities involves inherent risks, including but not limited to physical injury, illness, medical complications, temporary or permanent disability, grievous bodily injury, and death. I voluntarily assume all such risks on the child's behalf and accept full responsibility for any consequences arising from the child's participation in the Program.",
        "I represent and warrant that I have disclosed all relevant information relating to the child's physical, medical, emotional, or mental condition that may affect the child's ability to safely participate in the Program or that may pose a risk to the child or others.",
        "I acknowledge that I have either viewed or had the opportunity to view the facilities where the Program is conducted, reviewed or had the opportunity to review the qualifications of the instructors, received an explanation of the nature of the classes and the risks associated therewith, and had the opportunity to ask questions regarding the Program before the child participates.",
        "I agree to comply with all rules, policies, procedures, instructions, codes of conduct, safety requirements, and operational guidelines communicated by AMP from time to time, and to instruct the child to do the same.",
      ],
    },
    {
      title: "Services, Property, and Personal Information",
      paragraphs: [
        'I acknowledge that all services, facilities, programs, information, coaching, and access provided by AMP are offered on an "as is" basis without warranties of any kind, whether express or implied.',
        "I acknowledge and agree that any personal property brought by me or the child to any AMP or Physique 57 India location is brought entirely at our own risk. AMP and Physique 57 India shall not be responsible or liable for the loss, theft, damage, destruction, or safekeeping of any personal belongings.",
        "I consent to AMP collecting, storing, processing, transferring, disclosing, and otherwise handling my and the child's personal information, including sensitive personal information, for purposes relating to participation in the Program, in accordance with AMP's Privacy Policy and applicable law.",
      ],
    },
    {
      title: "Booking and Class Policies",
      paragraphs: [
        "Cancellations, transfers and refunds are not possible under this program.",
        "Participants arriving more than ten (10) minutes after the scheduled start time shall not be permitted to join the class, and such class shall be deducted from the participant's package.",
        "All classes must be paid for in advance and all payments are final and non-refundable. Where a class is fully booked, participants may be placed on a waitlist and spaces shall be allocated on a first-come, first-served basis. Instructor requests, preferred class dates, and preferred class timings are subject to availability and cannot be guaranteed.",
      ],
    },
    {
      title: "Governing Law and Signature Acknowledgement",
      paragraphs: [
        "This Agreement shall be governed by and construed in accordance with the laws of India. Any dispute arising out of or in connection with this Agreement shall be referred to and finally resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996. The seat, venue, and place of arbitration shall be Mumbai, Maharashtra, India, and the language of the proceedings shall be English.",
        "By signing below, I acknowledge that I have carefully read, fully understood, and voluntarily accepted the terms of this Release and Indemnity Agreement on behalf of myself and the child, and agree to be legally bound by its provisions.",
      ],
    },
  ],
};
