export interface DrawingTile {
  id: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  file?: string;
  revision: string;
  date: string;
}

export const ALL_DRAWINGS_BY_PROJECT: Record<number, DrawingTile[]> = {
  1: [
    { id: 'drw-1', title: 'Level 1 - Floor Plan', subtitle: 'Architectural floor plan showing wall layouts, door swings, and room dimensions for the ground level', thumbnail: '/assets/drawings/1195.png', file: '/assets/drawings/sample.pdf', revision: 'Rev 04', date: 'Mar 21, 2026' },
    { id: 'drw-2', title: 'Level 2 - Fire Protection', subtitle: 'MEP fire suppression sprinkler heads, standpipes, and alarm pull station locations', thumbnail: '/assets/drawings/drawing-10.webp', revision: 'Rev 03', date: 'Mar 18, 2026' },
    { id: 'drw-3', title: 'Level 3 - HVAC Layout', subtitle: 'Mechanical ductwork routing, VAV box locations, and thermostat zone assignments', thumbnail: '/assets/drawings/drawing-9.webp', revision: 'Rev 05', date: 'Mar 14, 2026' },
    { id: 'drw-4', title: 'Level 1 - Furniture Layout', subtitle: 'Interior design plan with workstation clusters, conference rooms, and break area furnishings', thumbnail: '/assets/drawings/drawing-11.webp', revision: 'Rev 02', date: 'Mar 10, 2026' },
    { id: 'drw-5', title: 'Level 1 - Electrical Plan', subtitle: 'Electrical power distribution, panel schedule references, and outlet receptacle locations', thumbnail: '/assets/drawings/drawing-13.webp', revision: 'Rev 03', date: 'Mar 5, 2026' },
    { id: 'drw-6', title: 'Level 2 - Partition Plan', subtitle: 'Architectural partition types and rated assemblies for tenant demising walls', thumbnail: '/assets/drawings/drawing-8.webp', revision: 'Rev 03', date: 'Feb 27, 2026' },
    { id: 'drw-7', title: 'Level 3 - Reflected Ceiling', subtitle: 'Ceiling grid layout with light fixture placement, diffuser locations, and access panels', thumbnail: '/assets/drawings/drawing-7.webp', revision: 'Rev 02', date: 'Feb 19, 2026' },
    { id: 'drw-8', title: 'Site Plan - Grading', subtitle: 'Civil grading plan with finish floor elevations, stormwater retention, and slope percentages', thumbnail: '/assets/drawings/drawing-6.webp', revision: 'Rev 02', date: 'Feb 12, 2026' },
    { id: 'drw-9', title: 'Roof Plan - Drainage', subtitle: 'Structural roof drainage plan showing crickets, scuppers, and internal roof drain piping', thumbnail: '/assets/drawings/drawing-12.webp', revision: 'Rev 01', date: 'Feb 4, 2026' },
    { id: 'drw-10', title: 'Level 2 - Plumbing Layout', subtitle: 'MEP plumbing waste and supply line routing with fixture unit calculations and cleanout access', thumbnail: '/assets/drawings/drawing-14.webp', revision: 'Rev 01', date: 'Jan 28, 2026' },
  ],
  2: [
    { id: 'drw-1', title: 'Foundation Plan', subtitle: 'Structural foundation layout with footing sizes, rebar schedules, and pier locations', thumbnail: '/assets/drawings/drawing-7.webp', revision: 'Rev 06', date: 'Mar 24, 2026' },
    { id: 'drw-2', title: 'Steel Framing - Level 2', subtitle: 'Structural steel beam and column layout with connection details and moment frame callouts', thumbnail: '/assets/drawings/drawing-12.webp', revision: 'Rev 04', date: 'Mar 19, 2026' },
    { id: 'drw-3', title: 'Exterior Elevations - North', subtitle: 'Architectural north elevation showing curtain wall system, louver locations, and material finishes', thumbnail: '/assets/drawings/drawing-6.webp', revision: 'Rev 03', date: 'Mar 11, 2026' },
    { id: 'drw-4', title: 'Waterproofing Details', subtitle: 'Below-grade waterproofing membrane details with drainage board and protection course specs', thumbnail: '/assets/drawings/drawing-8.webp', revision: 'Rev 02', date: 'Mar 3, 2026' },
    { id: 'drw-5', title: 'Landscape Plan', subtitle: 'Site landscape design with native plantings, irrigation zones, and hardscape paving patterns', thumbnail: '/assets/drawings/drawing-14.webp', revision: 'Rev 01', date: 'Feb 22, 2026' },
    { id: 'drw-6', title: 'Parking Garage - Level B1', subtitle: 'Below-grade parking layout with drive aisle widths, accessible stalls, and ventilation shafts', thumbnail: '/assets/drawings/drawing-11.webp', revision: 'Rev 02', date: 'Feb 14, 2026' },
  ],
  3: [
    { id: 'drw-1', title: 'Penthouse Mechanical Room', subtitle: 'Rooftop mechanical equipment layout including AHU placement, piping mains, and access clearances', thumbnail: '/assets/drawings/drawing-9.webp', revision: 'Rev 03', date: 'Mar 22, 2026' },
    { id: 'drw-2', title: 'Stairwell Pressurization', subtitle: 'Smoke control system layout with pressurization fan ductwork and fire damper locations', thumbnail: '/assets/drawings/drawing-10.webp', revision: 'Rev 02', date: 'Mar 15, 2026' },
    { id: 'drw-3', title: 'Telecom Room Layout', subtitle: 'IT infrastructure room with rack elevations, cable tray routing, and power redundancy feeds', thumbnail: '/assets/drawings/drawing-13.webp', revision: 'Rev 04', date: 'Mar 7, 2026' },
    { id: 'drw-4', title: 'Loading Dock Plan', subtitle: 'Service area layout with dock leveler positions, trash compactor pad, and turning radius clearances', thumbnail: '/assets/drawings/drawing-5.webp', revision: 'Rev 01', date: 'Feb 25, 2026' },
    { id: 'drw-5', title: 'Exterior Wall Sections', subtitle: 'Building envelope wall section details with insulation R-values, vapor barrier, and cladding attachments', thumbnail: '/assets/drawings/drawing-6.webp', revision: 'Rev 05', date: 'Feb 18, 2026' },
    { id: 'drw-6', title: 'Emergency Generator Plan', subtitle: 'Standby power system layout with generator pad, ATS location, and fuel storage tank details', thumbnail: '/assets/drawings/drawing-12.webp', revision: 'Rev 02', date: 'Feb 10, 2026' },
    { id: 'drw-7', title: 'Lobby Finish Plan', subtitle: 'Main lobby interior finishes with stone flooring patterns, feature wall cladding, and ceiling details', thumbnail: '/assets/drawings/drawing-11.webp', revision: 'Rev 03', date: 'Jan 30, 2026' },
    { id: 'drw-8', title: 'ADA Compliance Details', subtitle: 'Accessibility detail sheets with restroom clearances, ramp slopes, and signage mounting heights', thumbnail: '/assets/drawings/drawing-8.webp', revision: 'Rev 01', date: 'Jan 22, 2026' },
  ],
  4: [
    { id: 'drw-1', title: 'Photovoltaic Array Layout', subtitle: 'Rooftop solar panel arrangement with string sizing, inverter locations, and conduit routing', thumbnail: '/assets/drawings/drawing-14.webp', revision: 'Rev 02', date: 'Mar 23, 2026' },
    { id: 'drw-2', title: 'Building Section - East-West', subtitle: 'Longitudinal building section showing floor-to-floor heights, structural depths, and shaft alignments', thumbnail: '/assets/drawings/drawing-7.webp', revision: 'Rev 03', date: 'Mar 16, 2026' },
    { id: 'drw-3', title: 'Fire Alarm Riser Diagram', subtitle: 'Fire alarm system riser with device counts per floor, NAC circuit routing, and FACP panel schedule', thumbnail: '/assets/drawings/drawing-10.webp', revision: 'Rev 04', date: 'Mar 9, 2026' },
    { id: 'drw-4', title: 'Elevator Shaft Details', subtitle: 'Elevator hoistway plan and section with rail bracket spacing, pit depth, and machine room layout', thumbnail: '/assets/drawings/drawing-5.webp', revision: 'Rev 01', date: 'Feb 28, 2026' },
    { id: 'drw-5', title: 'Stormwater Management', subtitle: 'Site stormwater detention system with bioswale grading, inlet structures, and outfall pipe sizing', thumbnail: '/assets/drawings/drawing-9.webp', revision: 'Rev 02', date: 'Feb 15, 2026' },
  ],
  5: [
    { id: 'drw-1', title: 'Curtain Wall Elevation - South', subtitle: 'Unitized curtain wall panel layout with mullion spacing, spandrel locations, and expansion joints', thumbnail: '/assets/drawings/drawing-6.webp', revision: 'Rev 05', date: 'Mar 25, 2026' },
    { id: 'drw-2', title: 'Roof Framing Plan', subtitle: 'Structural roof framing with joist girder spans, bridging, and equipment dunnage locations', thumbnail: '/assets/drawings/drawing-12.webp', revision: 'Rev 03', date: 'Mar 20, 2026' },
    { id: 'drw-3', title: 'Chilled Water Piping', subtitle: 'Mechanical chilled water distribution plan with pipe sizes, isolation valves, and balancing stations', thumbnail: '/assets/drawings/drawing-9.webp', revision: 'Rev 04', date: 'Mar 13, 2026' },
    { id: 'drw-4', title: 'Restroom Enlarged Plans', subtitle: 'Enlarged restroom floor plans with fixture locations, partition layout, and floor drain placement', thumbnail: '/assets/drawings/drawing-8.webp', revision: 'Rev 02', date: 'Mar 6, 2026' },
    { id: 'drw-5', title: 'Concrete Slab Plan - L3', subtitle: 'Post-tensioned concrete slab layout with tendon profiles, pour sequences, and edge form details', thumbnail: '/assets/drawings/drawing-7.webp', revision: 'Rev 03', date: 'Feb 26, 2026' },
    { id: 'drw-6', title: 'Security Access Control', subtitle: 'Electronic access control plan with card reader locations, door hardware schedules, and conduit paths', thumbnail: '/assets/drawings/drawing-13.webp', revision: 'Rev 01', date: 'Feb 17, 2026' },
    { id: 'drw-7', title: 'Site Utility Plan', subtitle: 'Underground utility routing for water, sewer, gas, and electric with connection points and easements', thumbnail: '/assets/drawings/drawing-14.webp', revision: 'Rev 02', date: 'Feb 8, 2026' },
    { id: 'drw-8', title: 'Precast Panel Elevations', subtitle: 'Architectural precast concrete panel shop drawings with embed locations and joint sealant details', thumbnail: '/assets/drawings/drawing-11.webp', revision: 'Rev 04', date: 'Jan 31, 2026' },
    { id: 'drw-9', title: 'Kitchen Equipment Layout', subtitle: 'Commercial kitchen floor plan with equipment placement, utility rough-in, and exhaust hood sizing', thumbnail: '/assets/drawings/drawing-5.webp', revision: 'Rev 01', date: 'Jan 20, 2026' },
  ],
  6: [
    { id: 'drw-1', title: 'Seismic Bracing Plan', subtitle: 'Lateral force resisting system layout with brace frame locations, gusset plate details, and drift limits', thumbnail: '/assets/drawings/drawing-12.webp', revision: 'Rev 03', date: 'Mar 24, 2026' },
    { id: 'drw-2', title: 'Conveying Systems Plan', subtitle: 'Vertical transportation plan with elevator and escalator pit dimensions and machine room clearances', thumbnail: '/assets/drawings/drawing-5.webp', revision: 'Rev 02', date: 'Mar 17, 2026' },
    { id: 'drw-3', title: 'Data Center Floor Plan', subtitle: 'Raised floor data center layout with hot/cold aisle containment, UPS rooms, and cable tray routing', thumbnail: '/assets/drawings/drawing-13.webp', revision: 'Rev 05', date: 'Mar 8, 2026' },
    { id: 'drw-4', title: 'Window Schedule', subtitle: 'Window type schedule with frame profiles, glazing specs, U-values, and installation details', thumbnail: '/assets/drawings/drawing-10.webp', revision: 'Rev 01', date: 'Feb 20, 2026' },
  ],
  7: [
    { id: 'drw-1', title: 'Geotechnical Boring Log', subtitle: 'Subsurface investigation boring log locations with soil classifications and bearing capacity recommendations', thumbnail: '/assets/drawings/drawing-14.webp', revision: 'Rev 01', date: 'Mar 22, 2026' },
    { id: 'drw-2', title: 'Mass Grading Plan', subtitle: 'Earthwork cut and fill plan with proposed contours, retaining wall locations, and export volume calculations', thumbnail: '/assets/drawings/drawing-6.webp', revision: 'Rev 04', date: 'Mar 14, 2026' },
    { id: 'drw-3', title: 'Sanitary Sewer Layout', subtitle: 'Gravity sanitary sewer design with manhole locations, pipe slopes, and lift station details', thumbnail: '/assets/drawings/drawing-9.webp', revision: 'Rev 02', date: 'Mar 2, 2026' },
    { id: 'drw-4', title: 'Structural Column Schedule', subtitle: 'Column size and reinforcement schedule with splice locations, base plate details, and anchor bolt patterns', thumbnail: '/assets/drawings/drawing-7.webp', revision: 'Rev 03', date: 'Feb 21, 2026' },
    { id: 'drw-5', title: 'Irrigation Plan', subtitle: 'Landscape irrigation system with zone valves, head spacing, drip line routing, and controller schedules', thumbnail: '/assets/drawings/drawing-11.webp', revision: 'Rev 01', date: 'Feb 9, 2026' },
    { id: 'drw-6', title: 'Acoustical Ceiling Plan', subtitle: 'Acoustical treatment layout with NRC-rated panel placement, cloud installations, and sound barrier walls', thumbnail: '/assets/drawings/drawing-8.webp', revision: 'Rev 02', date: 'Jan 29, 2026' },
    { id: 'drw-7', title: 'Fire Sprinkler Plan - L1', subtitle: 'NFPA 13 wet sprinkler system layout with head spacing, main and branch line sizing, and hanger locations', thumbnail: '/assets/drawings/drawing-10.webp', revision: 'Rev 03', date: 'Jan 18, 2026' },
  ],
  8: [
    { id: 'drw-1', title: 'Canopy Framing Detail', subtitle: 'Entry canopy structural framing with HSS member sizes, connection details, and drainage scupper locations', thumbnail: '/assets/drawings/drawing-5.webp', revision: 'Rev 02', date: 'Mar 23, 2026' },
    { id: 'drw-2', title: 'Signage and Wayfinding Plan', subtitle: 'Interior wayfinding signage plan with ADA-compliant directory boards, room signs, and exit signage placement', thumbnail: '/assets/drawings/drawing-11.webp', revision: 'Rev 01', date: 'Mar 12, 2026' },
    { id: 'drw-3', title: 'Electrical One-Line Diagram', subtitle: 'Main electrical one-line diagram showing service entrance, switchgear, transformer sizing, and panel distribution', thumbnail: '/assets/drawings/drawing-13.webp', revision: 'Rev 06', date: 'Mar 4, 2026' },
    { id: 'drw-4', title: 'Domestic Water Riser', subtitle: 'Domestic hot and cold water riser diagram with pipe sizing, PRV stations, and recirculation pump locations', thumbnail: '/assets/drawings/drawing-9.webp', revision: 'Rev 03', date: 'Feb 23, 2026' },
    { id: 'drw-5', title: 'Masonry Wall Details', subtitle: 'CMU wall construction details with reinforcement spacing, control joints, and flashing at shelf angles', thumbnail: '/assets/drawings/drawing-8.webp', revision: 'Rev 02', date: 'Feb 11, 2026' },
    { id: 'drw-6', title: 'Ceiling Soffit Details', subtitle: 'Architectural soffit framing details with drywall build-outs, cove lighting, and access panel locations', thumbnail: '/assets/drawings/drawing-7.webp', revision: 'Rev 04', date: 'Feb 1, 2026' },
    { id: 'drw-7', title: 'Erosion Control Plan', subtitle: 'Construction-phase erosion and sediment control plan with silt fence, inlet protection, and SWPPP notes', thumbnail: '/assets/drawings/drawing-6.webp', revision: 'Rev 01', date: 'Jan 24, 2026' },
    { id: 'drw-8', title: 'Gas Piping Diagram', subtitle: 'Natural gas distribution diagram with meter location, pipe sizing, and equipment connection schedules', thumbnail: '/assets/drawings/drawing-14.webp', revision: 'Rev 02', date: 'Jan 15, 2026' },
    { id: 'drw-9', title: 'Paving and Striping Plan', subtitle: 'Parking lot paving plan with asphalt section detail, striping layout, and accessible route markings', thumbnail: '/assets/drawings/drawing-12.webp', revision: 'Rev 03', date: 'Jan 6, 2026' },
    { id: 'drw-10', title: 'Exhaust Fan Schedule', subtitle: 'Mechanical exhaust fan schedule with CFM ratings, duct routing, and roof curb penetration details', thumbnail: '/assets/drawings/drawing-10.webp', revision: 'Rev 01', date: 'Dec 28, 2025' },
    { id: 'drw-11', title: 'Toilet Room Accessories', subtitle: 'Enlarged plans showing grab bar placement, accessory mounting heights, and partition anchoring details', thumbnail: '/assets/drawings/drawing-8.webp', revision: 'Rev 02', date: 'Dec 19, 2025' },
    { id: 'drw-12', title: 'Lab Casework Layout', subtitle: 'Laboratory casework and fume hood layout with utility turret positions and emergency shower locations', thumbnail: '/assets/drawings/drawing-11.webp', revision: 'Rev 01', date: 'Dec 10, 2025' },
  ],
};
