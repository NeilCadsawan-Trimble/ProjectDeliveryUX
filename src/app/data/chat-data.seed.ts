import type { ChatChannel, ChatMessage } from './dashboard-data.types';

export const CHAT_CHANNELS: ChatChannel[] = [
  { id: 'internal', name: 'Internal Work', projectId: null },
  { id: 'riverside-office-complex', name: 'Riverside Office', projectId: 1 },
  { id: 'harbor-view-condominiums', name: 'Harbor View', projectId: 2 },
  { id: 'downtown-transit-hub', name: 'Transit Hub', projectId: 3 },
  { id: 'lakeside-medical-center', name: 'Lakeside Medical', projectId: 4 },
  { id: 'westfield-shopping-center', name: 'Westfield', projectId: 5 },
  { id: 'metro-bridge-rehabilitation', name: 'Metro Bridge', projectId: 6 },
  { id: 'sunset-ridge-apartments', name: 'Sunset Ridge', projectId: 7 },
  { id: 'industrial-park-warehouse', name: 'Industrial Park', projectId: 8 },
];

function msg(
  id: number,
  channelId: string,
  authorName: string,
  authorInitials: string,
  body: string,
  sentAt: string,
  extras?: { authorSlug?: string; isExternal?: boolean },
): ChatMessage {
  const row: ChatMessage = { id, channelId, authorName, authorInitials, body, sentAt };
  if (extras?.authorSlug) row.authorSlug = extras.authorSlug;
  if (extras?.isExternal) row.isExternal = true;
  return row;
}

export const CHAT_MESSAGES_SEED: ChatMessage[] = [
  // Internal Work — ops, check run, safety, plus an external broker
  msg(1, 'internal', 'Kelly Marshall', 'KM', 'Friday check run is locked at 10 a.m. Send me anything that needs to hit this week by 4 today.', '2026-08-18T09:12:00', { authorSlug: 'kelly' }),
  msg(2, 'internal', 'Frank Mendoza', 'FM', 'Take the Apex Electrical discount if the waiver is clean. Board pack still needs two sentences on Transit Hub recovery.', '2026-08-18T09:40:00', { authorSlug: 'frank' }),
  msg(3, 'internal', 'Bert Humphries', 'BH', 'I will send recovery language tonight. Harbor View membrane hold stays in the At Risk note.', '2026-08-18T10:05:00', { authorSlug: 'bert' }),
  msg(4, 'internal', 'Safety Desk', 'SD', 'Leading-edge stand-down is Tuesday. Field teams need to acknowledge in email, not just the tailgate sheet.', '2026-08-18T11:22:00'),
  msg(5, 'internal', 'Helena Ortiz', 'HO', 'Meridian Bonding: still waiting on the one-pager for Transit Hub recovery funding. Rate hold expires if we miss Friday.', '2026-08-19T08:15:00', { isExternal: true }),
  msg(6, 'internal', 'Pamela Chen', 'PC', 'I can pull insured values for Harbor View cladding and Medical Center MEP from the last estimates if Lena wants them today.', '2026-08-19T09:02:00', { authorSlug: 'pamela' }),
  msg(7, 'internal', 'Lena Brooks', 'LB', 'Please do. I will drop them in the renewal packet this afternoon.', '2026-08-19T09:18:00'),
  msg(8, 'internal', 'Dominique Marques', 'DM', 'Stand-down delivered on Transit Hub and Harbor View. Photos of the boards are in the safety folder.', '2026-08-19T16:44:00', { authorSlug: 'dominique' }),
  msg(9, 'internal', 'Kelly Marshall', 'KM', 'Tanya Reeves PTO (Aug 23-27) is still Pending. Payroll cutoff is tomorrow noon.', '2026-08-20T07:50:00', { authorSlug: 'kelly' }),
  msg(10, 'internal', 'Bert Humphries', 'BH', 'Approve Tanya. I will flip it in the widget after standup.', '2026-08-20T08:04:00', { authorSlug: 'bert' }),

  // Riverside
  msg(20, 'riverside-office-complex', 'Mike Osei', 'MO', 'Glazing crew is waiting on RFI-214. Anchors on 4-5 still do not match the shop drawings.', '2026-08-19T07:12:00'),
  msg(21, 'riverside-office-complex', 'Bert Humphries', 'BH', 'I pinged the AE. Need Dominique’s as-built grid today so they cannot stall on the shop drawing.', '2026-08-19T07:40:00', { authorSlug: 'bert' }),
  msg(22, 'riverside-office-complex', 'Dominique Marques', 'DM', 'Shooting the grid this morning. I will drop a marked PDF in here before lunch.', '2026-08-19T07:51:00', { authorSlug: 'dominique' }),
  msg(23, 'riverside-office-complex', 'Lin Zhao', 'LZ', 'Apex Electrical: we can split floors 3 and 4 this weekend if overtime is released by 3 p.m.', '2026-08-19T09:44:00', { isExternal: true }),
  msg(24, 'riverside-office-complex', 'Sarah Chen', 'SC', 'Submittal 3-A came back with a spacer comment only. Not a schedule hit if we answer tomorrow.', '2026-08-19T16:10:00'),
  msg(25, 'riverside-office-complex', 'Pamela Chen', 'PC', 'If they change the anchor system on RFI-214 it is a GMP pricing event. Do not close it as no-cost.', '2026-08-20T07:22:00', { authorSlug: 'pamela' }),
  msg(26, 'riverside-office-complex', 'Frank Mendoza', 'FM', 'Trimble Internal accepted the elevator cab add verbally. Pamela, I need EST-2026-041 on letterhead.', '2026-08-20T07:48:00', { authorSlug: 'frank' }),
  msg(27, 'riverside-office-complex', 'Kelly Marshall', 'KM', 'AE-8801 is in the queue with a waiver. It will make Friday’s check run if nothing else is missing.', '2026-08-20T08:08:00', { authorSlug: 'kelly' }),

  // Harbor View
  msg(40, 'harbor-view-condominiums', 'James Carter', 'JC', 'East wing deck is ready. Rain Thursday night — I want to pour Wednesday and cover.', '2026-08-18T07:25:00'),
  msg(41, 'harbor-view-condominiums', 'Bert Humphries', 'BH', 'Pour Wednesday. Lock the pump. I will tell Apex we are not gambling on Friday.', '2026-08-18T07:41:00', { authorSlug: 'bert' }),
  msg(42, 'harbor-view-condominiums', 'Marcus Hale', 'MH', 'Apex Corp: interiors stay paused until the membrane report is in. Please do not give us a calendar date you cannot keep.', '2026-08-19T10:18:00', { isExternal: true }),
  msg(43, 'harbor-view-condominiums', 'Dominique Marques', 'DM', 'Balcony waterproofing photos are in today’s daily report. West elevation was still wet at 2 p.m.', '2026-08-19T14:55:00', { authorSlug: 'dominique' }),
  msg(44, 'harbor-view-condominiums', 'Nick Park', 'NP', 'Slab edge at 5E is 3/8 past the line. I stopped the crew. Grind or document and pour?', '2026-08-18T10:46:00'),
  msg(45, 'harbor-view-condominiums', 'Dominique Marques', 'DM', 'Grind. Do not pour past the line. I will walk it before 2.', '2026-08-18T10:58:00', { authorSlug: 'dominique' }),
  msg(46, 'harbor-view-condominiums', 'Pamela Chen', 'PC', 'EST-2026-042 interiors T&M still has the roof-hold language in clarifications. Leave it there.', '2026-08-20T08:11:00', { authorSlug: 'pamela' }),
  msg(47, 'harbor-view-condominiums', 'Frank Mendoza', 'FM', 'Agree with Marcus — no fake date. Membrane report first, then interiors.', '2026-08-20T08:26:00', { authorSlug: 'frank' }),

  // Transit Hub
  msg(60, 'downtown-transit-hub', 'Dana Voss', 'DV', 'GlobalTech will not authorize overtime until the canopy steel CO is executed. Send me the latest recovery narrative.', '2026-08-20T08:32:00', { isExternal: true }),
  msg(61, 'downtown-transit-hub', 'Bert Humphries', 'BH', 'Narrative is in the owner folder. Dec 18 is still the date we are holding. No premium time until you execute.', '2026-08-20T08:41:00', { authorSlug: 'bert' }),
  msg(62, 'downtown-transit-hub', 'Inspector Ruiz', 'AR', 'City of Seattle: reinspect Aug 22 7:30 a.m. Bring the field weld map and grounding continuity. I will not walk without them.', '2026-08-19T15:12:00', { isExternal: true }),
  msg(63, 'downtown-transit-hub', 'Dominique Marques', 'DM', 'Weld map is marked. Grounding sheet is in the trailer. I will have both in-hand Saturday.', '2026-08-19T15:40:00', { authorSlug: 'dominique' }),
  msg(64, 'downtown-transit-hub', 'Priya Nair', 'PN', 'Budget is at 95%. Do not put more premium time on this job until the CO lands. We will eat contingency.', '2026-08-19T11:22:00'),
  msg(65, 'downtown-transit-hub', 'Frank Mendoza', 'FM', 'Board wants a revolver-vs-wait call. Bert, keep the field story tight. I will handle cash.', '2026-08-19T17:10:00', { authorSlug: 'frank' }),
  msg(66, 'downtown-transit-hub', 'Kelly Marshall', 'KM', 'When the canopy invoice arrives I will code it to 03-400 recovery, not contingency.', '2026-08-18T10:20:00', { authorSlug: 'kelly' }),
  msg(67, 'downtown-transit-hub', 'Daily Report Bot', 'DR', 'No daily report filed for Aug 19. Crew counts are in time. Please complete weather and work performed.', '2026-08-20T05:12:00'),

  // Lakeside Medical
  msg(80, 'lakeside-medical-center', 'Tom Evans', 'TE', 'Hanger layout on L2 conflicts with the duct bank at grid D. Pink ribbon is on the rod.', '2026-08-17T18:05:00'),
  msg(81, 'lakeside-medical-center', 'Dominique Marques', 'DM', 'I will look before 6 a.m. Do not let MEP cover it.', '2026-08-17T18:22:00', { authorSlug: 'dominique' }),
  msg(82, 'lakeside-medical-center', 'Rachel Kim', 'RK', 'Air-handler spec comments from the owner are what slipped EST-2026-044. Scope itself did not change.', '2026-08-18T09:10:00'),
  msg(83, 'lakeside-medical-center', 'Pamela Chen', 'PC', 'Thanks — I will keep the overdue flag honest and note the owner delay in the estimate log.', '2026-08-18T09:28:00', { authorSlug: 'pamela' }),
  msg(84, 'lakeside-medical-center', 'NexGen Facilities', 'NX', 'NexGen Analytics: please confirm the L2 hanger conflict will be resolved before Friday’s infection-control walk.', '2026-08-19T13:40:00', { isExternal: true }),
  msg(85, 'lakeside-medical-center', 'Bert Humphries', 'BH', 'It will be. Dominique is on it before the MEP crew returns. I will confirm once it is clear.', '2026-08-19T13:55:00', { authorSlug: 'bert' }),

  // Westfield
  msg(100, 'westfield-shopping-center', 'Nora Blake', 'NB', 'Brightline: bid invite for facade addendum 3 posts Friday. Confirm you are still bidding.', '2026-08-20T08:24:00', { isExternal: true }),
  msg(101, 'westfield-shopping-center', 'Pamela Chen', 'PC', 'Still bidding. I will send written confirmation after I read addendum 3.', '2026-08-20T08:33:00', { authorSlug: 'pamela' }),
  msg(102, 'westfield-shopping-center', 'Lena Brooks', 'LB', 'Bid walk is Friday through the loading dock, not the mall. Vest and hard hat.', '2026-08-16T09:15:00'),
  msg(103, 'westfield-shopping-center', 'Kelly Marshall', 'KM', 'Landscaping invoice is on hold until we have last month’s unconditional waiver. Nora, can your sub send it today?', '2026-08-18T14:30:00', { authorSlug: 'kelly' }),
  msg(104, 'westfield-shopping-center', 'Nora Blake', 'NB', 'I pinged them. You will have it this afternoon.', '2026-08-18T14:44:00', { isExternal: true }),
  msg(105, 'westfield-shopping-center', 'Bert Humphries', 'BH', 'Site is still Planning. Do not staff a full crew until the facade bid is in.', '2026-08-19T08:05:00', { authorSlug: 'bert' }),

  // Metro Bridge
  msg(120, 'metro-bridge-rehabilitation', 'Mike Osei', 'MO', 'Barrier-rail checkpoint is marked complete. Closeout package can start moving.', '2026-08-19T15:02:00'),
  msg(121, 'metro-bridge-rehabilitation', 'Bert Humphries', 'BH', 'Good. Keep Nov 20 in front of everyone. No extra scope without a CO.', '2026-08-19T15:18:00', { authorSlug: 'bert' }),
  msg(122, 'metro-bridge-rehabilitation', 'Kelly Marshall', 'KM', 'Retention release in November is realistic if waivers stay current. I can start the checklist next week.', '2026-08-16T13:25:00', { authorSlug: 'kelly' }),
  msg(123, 'metro-bridge-rehabilitation', 'DOT Inspector Chen', 'DC', 'WSDOT: barrier-rail punch photos need the stationing in the frame. Two shots were missing it.', '2026-08-19T16:10:00', { isExternal: true }),
  msg(124, 'metro-bridge-rehabilitation', 'Dominique Marques', 'DM', 'I will reshoot those two bays tomorrow with stationing in frame.', '2026-08-19T16:24:00', { authorSlug: 'dominique' }),
  msg(125, 'metro-bridge-rehabilitation', 'Frank Mendoza', 'FM', 'This is the closeout we want to show. Keep it boring and on date.', '2026-08-20T07:33:00', { authorSlug: 'frank' }),

  // Sunset Ridge
  msg(140, 'sunset-ridge-apartments', 'Carlos Medina', 'CM', 'Building B framing repair is done. Photos are in the shared folder. Need the deficiency closed to keep the next deck.', '2026-08-16T14:32:00'),
  msg(141, 'sunset-ridge-apartments', 'Priya Nair', 'PN', 'Special inspector still wants the stamped repair detail, not just photos.', '2026-08-17T08:20:00'),
  msg(142, 'sunset-ridge-apartments', 'Bert Humphries', 'BH', 'I approved the extra carpenter hours. Dominique, please close the log once the stamp is in.', '2026-08-17T08:44:00', { authorSlug: 'bert' }),
  msg(143, 'sunset-ridge-apartments', 'CoreSystems CM', 'CS', 'CoreSystems: we saw the At Risk flag. Is Building B still on the January date?', '2026-08-19T11:05:00', { isExternal: true }),
  msg(144, 'sunset-ridge-apartments', 'Bert Humphries', 'BH', 'January 15 is still the date. Framing deficiency is in repair, not a redesign. I will send a one-pager today.', '2026-08-19T11:19:00', { authorSlug: 'bert' }),
  msg(145, 'sunset-ridge-apartments', 'Dominique Marques', 'DM', 'Stamp is in. I will close the deficiency this afternoon.', '2026-08-20T07:58:00', { authorSlug: 'dominique' }),

  // Industrial Park
  msg(160, 'industrial-park-warehouse', 'Priya Nair', 'PN', 'DataDrive asked to split the dock expansion estimate into two milestones. Scope is the same.', '2026-08-17T10:08:00'),
  msg(161, 'industrial-park-warehouse', 'Pamela Chen', 'PC', 'Easy. I will recut EST-2026-048 to match. Due Sep 8 so we have room.', '2026-08-17T10:21:00', { authorSlug: 'pamela' }),
  msg(162, 'industrial-park-warehouse', 'DataDrive PM', 'DD', 'DataDrive AI: please keep the loading-dock work as a separate milestone so finance can encumber it alone.', '2026-08-18T09:50:00', { isExternal: true }),
  msg(163, 'industrial-park-warehouse', 'Bert Humphries', 'BH', 'Understood. Pamela will reissue. Field work stays Planning until the estimate is approved.', '2026-08-18T10:06:00', { authorSlug: 'bert' }),
  msg(164, 'industrial-park-warehouse', 'Derek Huang', 'DH', 'Survey control is still good from last month. I can re-establish if the dock split changes the pad.', '2026-08-19T07:30:00'),
  msg(165, 'industrial-park-warehouse', 'Dominique Marques', 'DM', 'Leave control. We should not move anything until the milestone split is on paper.', '2026-08-19T07:46:00', { authorSlug: 'dominique' }),
];
