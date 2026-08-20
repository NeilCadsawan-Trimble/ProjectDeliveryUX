import type { EmailPriority, WorkEmail } from './dashboard-data.types';

interface MailSpec {
  id: number;
  fromName: string;
  fromEmail: string;
  fromInitials: string;
  subject: string;
  preview: string;
  body: string;
  sentAt: string;
  unread: boolean;
  priority: EmailPriority;
  projectId: number | null;
  projectName?: string;
}

function mail(spec: MailSpec): WorkEmail {
  const row: WorkEmail = {
    id: spec.id,
    fromName: spec.fromName,
    fromEmail: spec.fromEmail,
    fromInitials: spec.fromInitials,
    subject: spec.subject,
    preview: spec.preview,
    body: spec.body,
    sentAt: spec.sentAt,
    unread: spec.unread,
    priority: spec.priority,
    projectId: spec.projectId,
  };
  if (spec.projectName) row.projectName = spec.projectName;
  return row;
}

const EMAILS_FRANK: WorkEmail[] = [
  mail({
    id: 1, fromName: 'Dana Voss', fromEmail: 'dana.voss@globaltech.com', fromInitials: 'DV',
    subject: 'Transit Hub recovery — owner review still open',
    preview: 'Canopy steel and ADA ramp COs need your sign-off before we can hold the Dec 18 date.',
    body: 'Frank — GlobalTech still has the canopy steel and ADA ramp change orders sitting in review. Bert has the backup package ready, but we cannot lock the Dec 18 recovery date without owner direction.\n\nPlease confirm whether we should proceed on overtime or wait for the board cash call. I can join a 15-minute call this afternoon.',
    sentAt: '2026-08-20T08:12:00', unread: true, priority: 'urgent',
    projectId: 3, projectName: 'Downtown Transit Hub',
  }),
  mail({
    id: 2, fromName: 'Helena Ortiz', fromEmail: 'helena.ortiz@meridianbond.com', fromInitials: 'HO',
    subject: 'Bonding capacity — Q3 portfolio review',
    preview: 'Working capital and the Transit Hub recovery are the two items underwriters flagged.',
    body: 'Frank, underwriting completed the Q3 look. Capacity is intact, but they want a one-page note on Transit Hub recovery funding and Harbor View contingency.\n\nIf you can send the cash position summary by Friday I will keep the rate hold through October.',
    sentAt: '2026-08-20T07:40:00', unread: true, priority: 'high',
    projectId: null,
  }),
  mail({
    id: 3, fromName: 'Marcus Hale', fromEmail: 'marcus.hale@apexcorp.com', fromInitials: 'MH',
    subject: 'Harbor View — roof membrane holding interiors',
    preview: 'Apex Corp will not release Unit Type B interiors until the membrane report is in.',
    body: 'Frank, we are aligned with Bert on the roof membrane hold. Interiors stay paused until the third-party report lands.\n\nPlease confirm Rocky Mountain will carry the weather protection cost so we do not reopen the GMP this month.',
    sentAt: '2026-08-19T16:22:00', unread: true, priority: 'high',
    projectId: 2, projectName: 'Harbor View Condominiums',
  }),
  mail({
    id: 4, fromName: 'Bert Humphries', fromEmail: 'bert.humphries@rockymtncontracting.com', fromInitials: 'BH',
    subject: 'Weekly owner pack — Aug 20',
    preview: 'Portfolio snapshot attached: one Overdue, two At Risk, remainder On Track / Planning.',
    body: 'Weekly pack for your 9:30. Transit Hub remains Overdue with a recovery narrative through Dec 18. Harbor View and Sunset Ridge stay At Risk.\n\nKelly flagged a $47.5K Apex Electrical invoice that needs your early-pay decision if we want the 2% discount.',
    sentAt: '2026-08-19T17:05:00', unread: false, priority: 'normal',
    projectId: null,
  }),
  mail({
    id: 5, fromName: 'Priya Nair', fromEmail: 'priya.nair@rockymtncontracting.com', fromInitials: 'PN',
    subject: 'Transit Hub budget at 95%',
    preview: '$45K remaining. Canopy recovery CO is the only path that does not eat contingency.',
    body: 'Flagging this before the owner call. Budget used is $855K of $900K. If the canopy CO slips past next week we will be into contingency on a job that is already Overdue.\n\nI recommend we do not authorize additional premium time until GlobalTech answers Dana.',
    sentAt: '2026-08-19T11:18:00', unread: false, priority: 'high',
    projectId: 3, projectName: 'Downtown Transit Hub',
  }),
  mail({
    id: 6, fromName: 'Lena Brooks', fromEmail: 'lena.brooks@rockymtncontracting.com', fromInitials: 'LB',
    subject: 'Insurance renewal — GL and builders risk',
    preview: 'Carrier wants updated values on Harbor View and Medical Center by Aug 27.',
    body: 'Renewal packet is otherwise complete. They need insured values for Harbor View cladding and Lakeside Medical Center MEP before Aug 27.\n\nI can pull the figures from Pamela’s last estimate if you want me to send without another review cycle.',
    sentAt: '2026-08-18T15:44:00', unread: false, priority: 'normal',
    projectId: null,
  }),
  mail({
    id: 7, fromName: 'Board Office', fromEmail: 'board@rockymtncontracting.com', fromInitials: 'BO',
    subject: 'Cash call window for Transit Hub recovery',
    preview: 'Directors asked whether we tap the revolver or wait on the owner CO.',
    body: 'For the Thursday board packet: please state whether Rocky Mountain will fund the Transit Hub recovery from the revolver or wait on GlobalTech’s CO.\n\nA two-sentence recommendation is enough. Kelly can attach the cash position exhibit.',
    sentAt: '2026-08-18T09:10:00', unread: true, priority: 'urgent',
    projectId: 3, projectName: 'Downtown Transit Hub',
  }),
  mail({
    id: 8, fromName: 'Sarah Chen', fromEmail: 'sarah.chen@rockymtncontracting.com', fromInitials: 'SC',
    subject: 'Riverside Phase 3 elevator finishes — $40K add',
    preview: 'Trimble Internal accepted the estimate verbally; they want it on your letterhead.',
    body: 'Trimble Internal verbally accepted the $40K elevator cab finishes add. They asked that the owner letter come from you rather than from estimating.\n\nPamela has EST-2026-041 in Awaiting Approval if you want to glance at the backup.',
    sentAt: '2026-08-17T14:02:00', unread: false, priority: 'normal',
    projectId: 1, projectName: 'Riverside Office Complex',
  }),
  mail({
    id: 9, fromName: 'Kelly Marshall', fromEmail: 'kelly.marshall@rockymtncontracting.com', fromInitials: 'KM',
    subject: 'Early-pay discounts this week',
    preview: 'Two invoices qualify if we run checks by Friday.',
    body: 'Two discounts expire Friday: Apex Electrical AE-8801 ($47,500 / 2%) and a Westfield site-services bill. Combined savings is just over $1,100.\n\nSay the word and I will put them on tomorrow’s check run.',
    sentAt: '2026-08-17T10:28:00', unread: false, priority: 'normal',
    projectId: null,
  }),
  mail({
    id: 10, fromName: 'James Carter', fromEmail: 'james.carter@rockymtncontracting.com', fromInitials: 'JC',
    subject: 'Harbor View moved to At Risk',
    preview: 'Roof membrane and balcony waterproofing are holding unit interiors.',
    body: 'Logging the status change you already saw on the dashboard. Field protection is in place; we are not taking on water, but we cannot release interiors.\n\nMarcus at Apex Corp will want a date. I need your cover if we tell them “after the membrane report,” not a calendar day.',
    sentAt: '2026-08-16T16:50:00', unread: false, priority: 'high',
    projectId: 2, projectName: 'Harbor View Condominiums',
  }),
];

const EMAILS_BERT: WorkEmail[] = [
  mail({
    id: 1001, fromName: 'Mike Osei', fromEmail: 'mike.osei@rockymtncontracting.com', fromInitials: 'MO',
    subject: 'RFI-214 — curtain wall anchors at Riverside 4-5',
    preview: 'Need an answer by Friday or glazing loses the next weather window.',
    body: 'Bert, RFI-214 is still open with the architect. Anchors at floors 4-5 do not match the approved shop drawings.\n\nIf we miss Friday we lose next week’s weather window. Can you ping the AE today?',
    sentAt: '2026-08-20T07:55:00', unread: true, priority: 'urgent',
    projectId: 1, projectName: 'Riverside Office Complex',
  }),
  mail({
    id: 1002, fromName: 'Dana Voss', fromEmail: 'dana.voss@globaltech.com', fromInitials: 'DV',
    subject: 'Transit Hub — overtime authorization',
    preview: 'GlobalTech will not authorize premium time until the canopy CO is executed.',
    body: 'Following last week’s recovery meeting: we cannot authorize overtime until the canopy steel CO is executed.\n\nPlease send the latest schedule narrative so I can take it back to our CM. Dec 18 is still the date we are holding internally.',
    sentAt: '2026-08-20T08:30:00', unread: true, priority: 'urgent',
    projectId: 3, projectName: 'Downtown Transit Hub',
  }),
  mail({
    id: 1003, fromName: 'Inspector Ruiz', fromEmail: 'aruiz@seattle.gov', fromInitials: 'AR',
    subject: 'Platform canopy inspection — reinspect Aug 22',
    preview: 'Failed items were weld maps and grounding continuity.',
    body: 'Reinspection is on the calendar for Aug 22 at 7:30 a.m. Bring the corrected weld map and grounding continuity report.\n\nIf those two close, I can sign the canopy hold so you can resume glazing at the west stair.',
    sentAt: '2026-08-19T15:10:00', unread: true, priority: 'high',
    projectId: 3, projectName: 'Downtown Transit Hub',
  }),
  mail({
    id: 1004, fromName: 'Lin Zhao', fromEmail: 'lin.zhao@apexelectrical.com', fromInitials: 'LZ',
    subject: 'MEP rough-in overtime — Riverside floors 3-4',
    preview: 'Crew can split zones this weekend if you release the extra hours.',
    body: 'We can run parallel work on floors 3 and 4 this weekend. I need written overtime authorization by 3 p.m. today.\n\nIf we do not get it, MEP stays at 35% and interior finishes will slip past Nov 30.',
    sentAt: '2026-08-19T09:42:00', unread: false, priority: 'high',
    projectId: 1, projectName: 'Riverside Office Complex',
  }),
  mail({
    id: 1005, fromName: 'Sarah Chen', fromEmail: 'sarah.chen@rockymtncontracting.com', fromInitials: 'SC',
    subject: 'Submittal 3-A glazing — returned with comments',
    preview: 'Architect wants a darker spacer. Does not change lead time if we answer tomorrow.',
    body: 'Glazing submittal 3-A came back with a spacer color comment only. Vendor says they can turn a response in 24 hours.\n\nI will handle the stamp if you want this off your plate before the owner walk on Friday.',
    sentAt: '2026-08-18T16:05:00', unread: false, priority: 'normal',
    projectId: 1, projectName: 'Riverside Office Complex',
  }),
  mail({
    id: 1006, fromName: 'James Carter', fromEmail: 'james.carter@rockymtncontracting.com', fromInitials: 'JC',
    subject: 'Harbor View Level 5 pour — weather hold',
    preview: 'Deck is ready. Forecast has rain Thursday night.',
    body: 'East wing deck is ready to pour. Forecast puts rain on Thursday night. I recommend we pour Wednesday and cover rather than gamble on Friday.\n\nNeed your call by noon so I can lock the pump.',
    sentAt: '2026-08-18T07:20:00', unread: true, priority: 'high',
    projectId: 2, projectName: 'Harbor View Condominiums',
  }),
  mail({
    id: 1007, fromName: 'Lena Brooks', fromEmail: 'lena.brooks@rockymtncontracting.com', fromInitials: 'LB',
    subject: 'Lookahead — week of Aug 24',
    preview: 'Three inspections, two owner walks, one city reinspect.',
    body: 'Lookahead attached. Watch items: Seattle canopy reinspect Aug 22, Harbor View owner walk Aug 25, Metro Bridge barrier-rail checkpoint Aug 26.\n\nI blocked your calendar. Tell me if Transit Hub recovery needs a second slot.',
    sentAt: '2026-08-17T13:33:00', unread: false, priority: 'normal',
    projectId: null,
  }),
  mail({
    id: 1008, fromName: 'Priya Nair', fromEmail: 'priya.nair@rockymtncontracting.com', fromInitials: 'PN',
    subject: 'Sunset Ridge framing deficiency — Building B',
    preview: 'Special inspector will not release the next floor until the repair is documented.',
    body: 'Building B framing deficiency is still open. Special inspector wants photo documentation and a stamped repair detail before the next deck.\n\nCarlos can have the repair done Thursday if you approve the extra carpenter hours.',
    sentAt: '2026-08-17T08:15:00', unread: false, priority: 'high',
    projectId: 7, projectName: 'Sunset Ridge Apartments',
  }),
  mail({
    id: 1009, fromName: 'Frank Mendoza', fromEmail: 'frank.mendoza@rockymtncontracting.com', fromInitials: 'FM',
    subject: 'Need recovery language for the board',
    preview: 'Two sentences on Transit Hub and Harbor View before Thursday.',
    body: 'Need two sentences from you for the board pack: Transit Hub recovery through Dec 18, and Harbor View membrane hold.\n\nKeep it field-accurate. I will handle the cash language.',
    sentAt: '2026-08-16T18:04:00', unread: false, priority: 'normal',
    projectId: null,
  }),
  mail({
    id: 1010, fromName: 'Tom Evans', fromEmail: 'tom.evans@rockymtncontracting.com', fromInitials: 'TE',
    subject: 'Medical Center MEP estimate EST-2026-044',
    preview: 'Submitted for approval. Due date already in the rearview.',
    body: 'EST-2026-044 is in. $220K MEP package for Lakeside. It shows overdue on Pamela’s board because the original due was Jul 24.\n\nI can walk Frank through it if he wants the technical backup before he signs.',
    sentAt: '2026-08-16T11:47:00', unread: false, priority: 'normal',
    projectId: 4, projectName: 'Lakeside Medical Center',
  }),
];

const EMAILS_KELLY: WorkEmail[] = [
  mail({
    id: 2001, fromName: 'Lin Zhao', fromEmail: 'lin.zhao@apexelectrical.com', fromInitials: 'LZ',
    subject: 'Invoice AE-8801 — early-pay discount expires Friday',
    preview: '2% if paid by Aug 22. Lien waiver is attached.',
    body: 'Kelly, AE-8801 for $47,500 is ready. Conditional waiver is attached. The 2% discount expires Friday.\n\nPlease confirm it is on the next check run so I can release the remaining fixtures for Riverside 3.',
    sentAt: '2026-08-20T08:05:00', unread: true, priority: 'urgent',
    projectId: 1, projectName: 'Riverside Office Complex',
  }),
  mail({
    id: 2002, fromName: 'Vendor Portal', fromEmail: 'noreply@vendorpay.example', fromInitials: 'VP',
    subject: 'Three invoices waiting in the queue',
    preview: 'Two on hold for missing waivers. One ready to code.',
    body: 'Overnight ingest: three new invoices. Two are on hold pending lien waivers (Westfield landscaping, Sunset Ridge lumber). One Apex Electrical bill is coded and ready.\n\nOpen the invoice queue to assign.',
    sentAt: '2026-08-20T06:15:00', unread: true, priority: 'high',
    projectId: null,
  }),
  mail({
    id: 2003, fromName: 'Sarah Chen', fromEmail: 'sarah.chen@rockymtncontracting.com', fromInitials: 'SC',
    subject: 'Pay app #12 — Riverside',
    preview: 'Net due looks right. Retention still at 5%.',
    body: 'Pay app 12 for Riverside is in your queue. Net due matches what we walked Thursday. Retention stays at 5% through envelope completion.\n\nFrank asked that this not sit over the weekend.',
    sentAt: '2026-08-19T16:40:00', unread: true, priority: 'high',
    projectId: 1, projectName: 'Riverside Office Complex',
  }),
  mail({
    id: 2004, fromName: 'Frank Mendoza', fromEmail: 'frank.mendoza@rockymtncontracting.com', fromInitials: 'FM',
    subject: 'Friday check run — include discounts',
    preview: 'If the Apex Electrical discount is real, take it.',
    body: 'Put AE-8801 on Friday’s run if the waiver is clean. Same for the Westfield site-services bill if the discount is still live.\n\nDo not wait on me unless something is missing.',
    sentAt: '2026-08-19T12:02:00', unread: false, priority: 'normal',
    projectId: null,
  }),
  mail({
    id: 2005, fromName: 'Lena Brooks', fromEmail: 'lena.brooks@rockymtncontracting.com', fromInitials: 'LB',
    subject: 'PTO — Tanya Reeves pending',
    preview: 'Aug 23-27 still sitting in Pending. Payroll needs a decision.',
    body: 'Tanya’s vacation (Aug 23-27) is still Pending. Payroll cutoff is tomorrow noon.\n\nIf Bert has not looked, can you nudge him? I do not want to reverse a check.',
    sentAt: '2026-08-19T09:18:00', unread: true, priority: 'high',
    projectId: 3, projectName: 'Downtown Transit Hub',
  }),
  mail({
    id: 2006, fromName: 'Nora Blake', fromEmail: 'nora.blake@brightline.co', fromInitials: 'NB',
    subject: 'Westfield — missing unconditional waiver',
    preview: 'We cannot pay the landscaping invoice without it.',
    body: 'The landscaping invoice is otherwise fine. We still need the unconditional waiver from last month’s payment before we will process this one.\n\nCan you chase the sub? Happy to jump on a call.',
    sentAt: '2026-08-18T14:27:00', unread: false, priority: 'high',
    projectId: 5, projectName: 'Westfield Shopping Center',
  }),
  mail({
    id: 2007, fromName: 'Bert Humphries', fromEmail: 'bert.humphries@rockymtncontracting.com', fromInitials: 'BH',
    subject: 'Code the canopy CO against Transit Hub 03-400',
    preview: 'Do not land it in contingency. Use the recovery cost code.',
    body: 'When the canopy steel CO invoice arrives, code it to 03-400 recovery, not contingency. Priya will send the budget line.\n\nFlag me if AP tries to split it.',
    sentAt: '2026-08-18T10:11:00', unread: false, priority: 'normal',
    projectId: 3, projectName: 'Downtown Transit Hub',
  }),
  mail({
    id: 2008, fromName: 'Apex Electrical AP', fromEmail: 'ap@apexelectrical.com', fromInitials: 'AE',
    subject: 'Statement — 45 days on Harbor View lighting',
    preview: 'Aging is crossing 45. Please confirm status.',
    body: 'Harbor View lighting package is at 45 days. We have not received a dispute, so I am checking whether it is in your next run.\n\nA short status reply is enough so I do not escalate.',
    sentAt: '2026-08-17T15:55:00', unread: false, priority: 'normal',
    projectId: 2, projectName: 'Harbor View Condominiums',
  }),
  mail({
    id: 2009, fromName: 'Learning Team', fromEmail: 'learn@rockymtncontracting.com', fromInitials: 'LT',
    subject: 'Comptroller track — two hours remaining this week',
    preview: 'You are on pace if you finish the current module by Friday.',
    body: 'Reminder only. You have a module in progress on the comptroller track. Two hours this week keeps you on the October exam plan.\n\nNo action needed if you already blocked Friday afternoon.',
    sentAt: '2026-08-17T08:00:00', unread: false, priority: 'normal',
    projectId: null,
  }),
  mail({
    id: 2010, fromName: 'Retention Desk', fromEmail: 'retention@rockymtncontracting.com', fromInitials: 'RD',
    subject: 'Metro Bridge retention release window',
    preview: 'Closeout package is close. Release could hit November.',
    body: 'Metro Bridge is far enough along that a retention release in November is realistic if lien waivers stay current.\n\nI will start the checklist next week unless you want to wait until the barrier-rail checkpoint closes.',
    sentAt: '2026-08-16T13:21:00', unread: false, priority: 'normal',
    projectId: 6, projectName: 'Metro Bridge Rehabilitation',
  }),
];

const EMAILS_DOMINIQUE: WorkEmail[] = [
  mail({
    id: 3001, fromName: 'Mike Osei', fromEmail: 'mike.osei@rockymtncontracting.com', fromInitials: 'MO',
    subject: 'Layout check — Riverside curtain wall grid',
    preview: 'Need you on 4 before the glazing crew sets the next ladder.',
    body: 'Dominique, can you verify the curtain wall grid on 4 this morning? The glazing crew is waiting on your layout before they hang the next ladder.\n\nRFI-214 is still open, so shoot the as-built even if the AE has not answered.',
    sentAt: '2026-08-20T06:48:00', unread: true, priority: 'urgent',
    projectId: 1, projectName: 'Riverside Office Complex',
  }),
  mail({
    id: 3002, fromName: 'Inspector Ruiz', fromEmail: 'aruiz@seattle.gov', fromInitials: 'AR',
    subject: 'Weld map — bring the marked-up sheet Saturday',
    preview: 'I will not walk the canopy without the field copy.',
    body: 'For the Aug 22 reinspect, I need the field weld map in your hand, not just in the trailer. Grounding continuity too.\n\nText me if the west stair is still blocked so I can stage from the platform.',
    sentAt: '2026-08-19T17:22:00', unread: true, priority: 'high',
    projectId: 3, projectName: 'Downtown Transit Hub',
  }),
  mail({
    id: 3003, fromName: 'James Carter', fromEmail: 'james.carter@rockymtncontracting.com', fromInitials: 'JC',
    subject: 'Harbor View — balcony waterproofing photos',
    preview: 'QA wants today’s photos in the daily report, not tomorrow.',
    body: 'Please drop balcony waterproofing photos into today’s daily report. QA is using them for the membrane hold discussion with Apex.\n\nIf the west elevation is still wet, note that in the weather block so we do not get accused of skipping it.',
    sentAt: '2026-08-19T12:05:00', unread: true, priority: 'high',
    projectId: 2, projectName: 'Harbor View Condominiums',
  }),
  mail({
    id: 3004, fromName: 'Safety Desk', fromEmail: 'safety@rockymtncontracting.com', fromInitials: 'SD',
    subject: 'Stand-down acknowledgment — leading edges',
    preview: 'Please confirm the Tuesday talk happened on Transit Hub and Harbor View.',
    body: 'Need acknowledgment that the leading-edge stand-down was delivered on Transit Hub and Harbor View. Two sentences in email is enough.\n\nCorporate is auditing this week after the near-miss on another job.',
    sentAt: '2026-08-19T09:00:00', unread: false, priority: 'high',
    projectId: null,
  }),
  mail({
    id: 3005, fromName: 'Bert Humphries', fromEmail: 'bert.humphries@rockymtncontracting.com', fromInitials: 'BH',
    subject: 'RFI-214 field measurements',
    preview: 'Architect asked for your as-built, not the shop drawing.',
    body: 'AE wants the as-built grid from you, not the shop drawing, before they answer RFI-214.\n\nIf you can send a marked PDF today I will get it in front of them before they leave the office.',
    sentAt: '2026-08-18T15:36:00', unread: false, priority: 'urgent',
    projectId: 1, projectName: 'Riverside Office Complex',
  }),
  mail({
    id: 3006, fromName: 'Nick Park', fromEmail: 'nick.park@rockymtncontracting.com', fromInitials: 'NP',
    subject: 'Harbor View QA — unit 5E slab edge',
    preview: 'Sawcut is 3/8 past the line. Need your call before they pour.',
    body: 'Slab edge at 5E is 3/8 past the line. I stopped the crew. Do we grind or pour and document?\n\nI am on the deck until 2.',
    sentAt: '2026-08-18T10:44:00', unread: true, priority: 'high',
    projectId: 2, projectName: 'Harbor View Condominiums',
  }),
  mail({
    id: 3007, fromName: 'Sarah Chen', fromEmail: 'sarah.chen@rockymtncontracting.com', fromInitials: 'SC',
    subject: 'Submittal 12-C embeds — field conflict',
    preview: 'Approved drawing does not match what is in the deck.',
    body: 'Embeds on 12-C do not match what you flagged in the deck. I can open an RFI this afternoon if you send a photo with a tape in the frame.\n\nDo not let them cover it.',
    sentAt: '2026-08-17T16:19:00', unread: false, priority: 'normal',
    projectId: 2, projectName: 'Harbor View Condominiums',
  }),
  mail({
    id: 3008, fromName: 'Daily Report Bot', fromEmail: 'reports@rockymtncontracting.com', fromInitials: 'DR',
    subject: 'Missing daily report — Transit Hub Aug 19',
    preview: 'No report filed for yesterday. Crew count was entered in time.',
    body: 'Time was entered for Transit Hub yesterday but no daily report was filed. Please complete weather, workforce, and work performed so payroll and QA stay in sync.\n\nDraft is waiting with crew counts already filled.',
    sentAt: '2026-08-20T05:10:00', unread: true, priority: 'normal',
    projectId: 3, projectName: 'Downtown Transit Hub',
  }),
  mail({
    id: 3009, fromName: 'Tom Evans', fromEmail: 'tom.evans@rockymtncontracting.com', fromInitials: 'TE',
    subject: 'Medical Center — hanger layout L2',
    preview: 'I left pink ribbon on the conflict with the duct bank.',
    body: 'Hanger layout on L2 conflicts with the duct bank at grid D. Pink ribbon is on the rod. Can you look before the MEP crew comes back at 6 a.m.?\n\nI will meet you there if you text.',
    sentAt: '2026-08-17T18:02:00', unread: false, priority: 'normal',
    projectId: 4, projectName: 'Lakeside Medical Center',
  }),
  mail({
    id: 3010, fromName: 'Carlos Medina', fromEmail: 'carlos.medina@rockymtncontracting.com', fromInitials: 'CM',
    subject: 'Sunset Ridge — repair detail photos',
    preview: 'Framing repair is done. Need you to close the deficiency.',
    body: 'Building B repair is done. Photos are in the shared folder. If you can close the deficiency in the inspection log this afternoon, we can keep the next deck.',
    sentAt: '2026-08-16T14:30:00', unread: false, priority: 'normal',
    projectId: 7, projectName: 'Sunset Ridge Apartments',
  }),
];

const EMAILS_PAMELA: WorkEmail[] = [
  mail({
    id: 4001, fromName: 'Nora Blake', fromEmail: 'nora.blake@brightline.co', fromInitials: 'NB',
    subject: 'Bid invite — Westfield facade addendum 3',
    preview: 'Addendum 3 drops Friday. Please confirm you are still bidding.',
    body: 'Pamela, addendum 3 for the Westfield facade renovation posts Friday. We need written confirmation Rocky Mountain is still bidding.\n\nWalk is still on the calendar next week if you want a second look at the existing storefront.',
    sentAt: '2026-08-20T08:22:00', unread: true, priority: 'urgent',
    projectId: 5, projectName: 'Westfield Shopping Center',
  }),
  mail({
    id: 4002, fromName: 'Vendor Quotes', fromEmail: 'quotes@glazetech.example', fromInitials: 'GQ',
    subject: 'Glazing quote — Riverside Phase 3',
    preview: 'Lead time 14 weeks. Price is good through Aug 29.',
    body: 'Updated glazing quote attached. 14-week lead. Price is firm through Aug 29.\n\nIf the darker spacer from submittal 3-A sticks, add 6 days — not dollars — to fabrication.',
    sentAt: '2026-08-20T07:05:00', unread: true, priority: 'high',
    projectId: 1, projectName: 'Riverside Office Complex',
  }),
  mail({
    id: 4003, fromName: 'Frank Mendoza', fromEmail: 'frank.mendoza@rockymtncontracting.com', fromInitials: 'FM',
    subject: 'EST-2026-041 — elevator finishes',
    preview: 'Trimble Internal wants this on letterhead. Please push it through.',
    body: 'Sarah says Trimble Internal accepted the $40K elevator add verbally. Please move EST-2026-041 to a clean owner letter so I can sign today.\n\nIf anything in the backup is soft, flag it before I send.',
    sentAt: '2026-08-19T16:55:00', unread: true, priority: 'high',
    projectId: 1, projectName: 'Riverside Office Complex',
  }),
  mail({
    id: 4004, fromName: 'Tom Evans', fromEmail: 'tom.evans@rockymtncontracting.com', fromInitials: 'TE',
    subject: 'EST-2026-044 MEP — overdue on your board',
    preview: 'Package is in. Original due was Jul 24.',
    body: 'MEP package for Lakeside is submitted. It will show overdue because the original due was Jul 24. Scope did not change; the delay was owner comments on the air-handler spec.\n\nHappy to review line-by-line if you want a second set of eyes before Frank sees it.',
    sentAt: '2026-08-19T11:12:00', unread: false, priority: 'high',
    projectId: 4, projectName: 'Lakeside Medical Center',
  }),
  mail({
    id: 4005, fromName: 'Sarah Chen', fromEmail: 'sarah.chen@rockymtncontracting.com', fromInitials: 'SC',
    subject: 'RFI that hits the Riverside GMP',
    preview: 'Curtain wall anchors — if the AE changes the system it is a pricing event.',
    body: 'RFI-214 is still open. If the AE changes the anchor system it is a pricing event on the Riverside GMP.\n\nI will keep you copied. Do not let this close as “no cost” without your look.',
    sentAt: '2026-08-18T14:48:00', unread: true, priority: 'urgent',
    projectId: 1, projectName: 'Riverside Office Complex',
  }),
  mail({
    id: 4006, fromName: 'Bert Humphries', fromEmail: 'bert.humphries@rockymtncontracting.com', fromInitials: 'BH',
    subject: 'Harbor View interiors T&M — EST-2026-042',
    preview: 'Apex wants a number even while the membrane is on hold.',
    body: 'Apex still wants a T&M number for unit interiors even though the membrane is holding the work. EST-2026-042 is under review.\n\nPlease keep the roof-hold language in the clarifications so we do not eat delay.',
    sentAt: '2026-08-18T09:30:00', unread: false, priority: 'normal',
    projectId: 2, projectName: 'Harbor View Condominiums',
  }),
  mail({
    id: 4007, fromName: 'Addenda Desk', fromEmail: 'addenda@globaltech.com', fromInitials: 'AD',
    subject: 'Transit Hub signage package — addendum 1',
    preview: 'Scope added platform IDs and ADA tactile maps.',
    body: 'Addendum 1 to the signage package adds platform IDs and ADA tactile maps. Please acknowledge receipt.\n\nBid date did not move. EST-2026-061 is the placeholder on your side.',
    sentAt: '2026-08-17T15:16:00', unread: false, priority: 'high',
    projectId: 3, projectName: 'Downtown Transit Hub',
  }),
  mail({
    id: 4008, fromName: 'Priya Nair', fromEmail: 'priya.nair@rockymtncontracting.com', fromInitials: 'PN',
    subject: 'Warehouse dock expansion — owner comments',
    preview: 'DataDrive AI asked for a milestone split. Easy if we re-cut the schedule.',
    body: 'DataDrive asked to split EST-2026-048 into two milestones. Scope is the same. I can re-cut the schedule if you want the estimate to match.\n\nDue Sep 8, so we have time.',
    sentAt: '2026-08-17T10:04:00', unread: false, priority: 'normal',
    projectId: 8, projectName: 'Industrial Park Warehouse',
  }),
  mail({
    id: 4009, fromName: 'James Carter', fromEmail: 'james.carter@rockymtncontracting.com', fromInitials: 'JC',
    subject: 'Harbor View unit interiors — quantities from the model',
    preview: 'Takeoff from rev 12 is in the folder. Balconies excluded.',
    body: 'Takeoff from the Harbor View model (rev 12 Oct) is in the estimate folder. I excluded balconies because of the waterproofing hold.\n\nPing me if you want a live walkthrough in the model widget.',
    sentAt: '2026-08-16T16:40:00', unread: false, priority: 'normal',
    projectId: 2, projectName: 'Harbor View Condominiums',
  }),
  mail({
    id: 4010, fromName: 'Lena Brooks', fromEmail: 'lena.brooks@rockymtncontracting.com', fromInitials: 'LB',
    subject: 'Bid walk reminder — Westfield Friday',
    preview: 'Site access is through the loading dock. Bring a vest.',
    body: 'Westfield bid walk is Friday. Access through the loading dock, not the mall. Vest and hard hat.\n\nI put it on your calendar against the existing Westfield block.',
    sentAt: '2026-08-16T09:12:00', unread: false, priority: 'normal',
    projectId: 5, projectName: 'Westfield Shopping Center',
  }),
];

export function emailsForPersona(slug?: string): WorkEmail[] {
  switch (slug) {
    case 'bert': return EMAILS_BERT.map(e => ({ ...e }));
    case 'kelly': return EMAILS_KELLY.map(e => ({ ...e }));
    case 'dominique': return EMAILS_DOMINIQUE.map(e => ({ ...e }));
    case 'pamela': return EMAILS_PAMELA.map(e => ({ ...e }));
    default: return EMAILS_FRANK.map(e => ({ ...e }));
  }
}
