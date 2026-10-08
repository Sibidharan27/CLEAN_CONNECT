import User from './models/User.js';
import Driver from './models/Driver.js';
import Citizen from './models/Citizen.js';
import Vehicle from './models/Vehicle.js';
import Complaint from './models/Complaint.js';
import Route from './models/Route.js';
import Schedule from './models/Schedule.js';
import { PEELAMEDU_ZONES } from './utils/zonesData.js';

export async function seedAll() {
  try {
    // 1. Admin
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'System Administrator',
        email: 'admin@cleanconnect.gov.in',
        password: 'admin123',
        role: 'admin',
      });
      console.log('✅ Seeded admin: admin@cleanconnect.gov.in / admin123');
    }

    // 2. Drivers (1 driver per Peelamedu Zone)
    const driverCount = await Driver.countDocuments();
    let muruganDriver = null;
    let selvamDriver = null;
    let praveenDriver = null;

    if (driverCount === 0) {
      muruganDriver = await Driver.create({
        name: 'Murugan S',
        email: 'murugan.s@cleanconnect.gov.in',
        password: 'driver123',
        phone: '+91 87654 32109',
        employeeId: 'EMP-2024-056',
        zone: 'Peelamedu – PSG Zone',
        vehicleId: 'GCT-001',
        shift: '6:00 AM - 2:00 PM',
        joiningDate: 'March 2023',
      });

      selvamDriver = await Driver.create({
        name: 'Selvam K',
        email: 'selvam.k@cleanconnect.gov.in',
        password: 'driver123',
        phone: '+91 98765 43210',
        employeeId: 'EMP-2024-057',
        zone: 'Peelamedu – Hope College Zone',
        vehicleId: 'JCB-001',
        shift: '7:00 AM - 3:00 PM',
        joiningDate: 'July 2023',
      });

      praveenDriver = await Driver.create({
        name: 'Praveen Kumar',
        email: 'praveen.k@cleanconnect.gov.in',
        password: 'driver123',
        phone: '+91 98403 45678',
        employeeId: 'EMP-2024-058',
        zone: 'Peelamedu – Avinashi Road Zone',
        vehicleId: 'ML-001',
        shift: '2:00 PM - 10:00 PM',
        joiningDate: 'January 2024',
      });

      console.log('✅ Seeded Peelamedu zone drivers (Murugan, Selvam, Praveen)');
    } else {
      muruganDriver = await Driver.findOne({ email: 'murugan.s@cleanconnect.gov.in' });
      selvamDriver = await Driver.findOne({ email: 'selvam.k@cleanconnect.gov.in' });
      praveenDriver = await Driver.findOne({ email: 'praveen.k@cleanconnect.gov.in' });
    }

    // 3. Vehicles (Assigned to Drivers / Zones)
    const vehicleCount = await Vehicle.countDocuments();
    if (vehicleCount === 0) {
      await Vehicle.insertMany([
        {
          vehicleId: 'GCT-001',
          type: 'garbage_truck',
          plateNumber: 'TN-38-AA-1234',
          capacity: '5 Tonnes Compactor',
          assignedDriver: muruganDriver?._id || null,
          currentArea: 'Peelamedu – PSG Zone',
          status: 'active',
          fuelLevel: 85,
        },
        {
          vehicleId: 'JCB-001',
          type: 'jcb',
          plateNumber: 'TN-38-JC-4501',
          capacity: 'Heavy Dump Clearance',
          assignedDriver: selvamDriver?._id || null,
          currentArea: 'Peelamedu – Hope College Zone',
          status: 'active',
          fuelLevel: 70,
        },
        {
          vehicleId: 'ML-001',
          type: 'mini_loader',
          plateNumber: 'TN-38-ML-8820',
          capacity: '1.5 Tonnes Loader',
          assignedDriver: praveenDriver?._id || null,
          currentArea: 'Peelamedu – Avinashi Road Zone',
          status: 'active',
          fuelLevel: 60,
        },
        {
          vehicleId: 'RS-001',
          type: 'road_sweeper',
          plateNumber: 'TN-38-RS-3319',
          capacity: 'Vacuum Sweeper',
          assignedDriver: null,
          currentArea: 'Avinashi Road Peelamedu corridor',
          status: 'maintenance',
          fuelLevel: 25,
        },
      ]);
      console.log('✅ Seeded Peelamedu fleet vehicles');
    }

    // 4. Citizens (Mapped to Peelamedu Area, Zone, and Street)
    const citizenCount = await Citizen.countDocuments();
    let aravindCitizen = null;
    let priyaCitizen = null;
    let karthikCitizen = null;
    let deepaCitizen = null;

    if (citizenCount === 0) {
      aravindCitizen = await Citizen.create({
        name: 'Aravind Kumar',
        email: 'aravind.kumar@email.com',
        password: 'password123',
        phone: '+91 94876 54321',
        area: 'Peelamedu',
        zone: 'Peelamedu – PSG Zone',
        street: 'PSG Tech College Road',
        address: '12, PSG Tech College Road, Peelamedu, Coimbatore - 641004',
      });

      priyaCitizen = await Citizen.create({
        name: 'Priya Raman',
        email: 'priya.raman@email.com',
        password: 'password123',
        phone: '+91 98450 12345',
        area: 'Peelamedu',
        zone: 'Peelamedu – PSG Zone',
        street: 'Peelamedu Colony 2nd Street',
        address: '45, Peelamedu Colony 2nd Street, Peelamedu, Coimbatore - 641004',
      });

      karthikCitizen = await Citizen.create({
        name: 'Karthik Sundaram',
        email: 'karthik.s@email.com',
        password: 'password123',
        phone: '+91 97123 45678',
        area: 'Peelamedu',
        zone: 'Peelamedu – Hope College Zone',
        street: 'Hope College Junction Road',
        address: '8, Hope College Junction Road, Peelamedu, Coimbatore - 641004',
      });

      deepaCitizen = await Citizen.create({
        name: 'Deepa Lakshmi',
        email: 'deepa.l@email.com',
        password: 'password123',
        phone: '+91 96234 56789',
        area: 'Peelamedu',
        zone: 'Peelamedu – Avinashi Road Zone',
        street: 'Fun Republic Mall Service Road',
        address: '23, Fun Republic Mall Service Road, Peelamedu, Coimbatore - 641004',
      });

      console.log('✅ Seeded 4 Peelamedu zone citizens');
    } else {
      aravindCitizen = await Citizen.findOne({ email: 'aravind.kumar@email.com' });
      priyaCitizen = await Citizen.findOne({ email: 'priya.raman@email.com' });
    }

    // 5. Complaints (Properly tagged with Area, Zone, Street)
    const complaintCount = await Complaint.countDocuments();
    if (complaintCount === 0 && (aravindCitizen || priyaCitizen)) {
      await Complaint.insertMany([
        {
          citizen: aravindCitizen?._id || priyaCitizen?._id,
          title: 'Overflowing Bin near PSG Tech Gate',
          category: 'Overflowing Bin',
          description: 'The community bin at PSG Tech College Road is overflowing with waste spilling onto the road.',
          area: 'Peelamedu',
          zone: 'Peelamedu – PSG Zone',
          street: 'PSG Tech College Road',
          location: {
            address: 'PSG Tech College Road, Peelamedu',
            latitude: 11.0244,
            longitude: 77.0028,
          },
          status: 'in_progress',
          priority: 'high',
          assignedDriver: muruganDriver?._id || null,
          timeline: [
            { status: 'open', time: new Date(Date.now() - 3600000 * 5), note: 'Complaint registered by citizen in Peelamedu – PSG Zone' },
            { status: 'assigned', time: new Date(Date.now() - 3600000 * 3), note: 'Assigned to driver Murugan S (GCT-001)' },
            { status: 'in_progress', time: new Date(Date.now() - 3600000 * 1), note: 'Driver collecting on street' },
          ],
        },
        {
          citizen: priyaCitizen?._id || aravindCitizen?._id,
          title: 'Illegal Dumping behind Fun Republic Mall',
          category: 'Illegal Dumping',
          description: 'Commercial debris piled up behind Fun Republic Mall Service Road. Loader required.',
          area: 'Peelamedu',
          zone: 'Peelamedu – Avinashi Road Zone',
          street: 'Fun Republic Mall Service Road',
          location: {
            address: 'Fun Republic Mall Service Road, Peelamedu',
            latitude: 11.0255,
            longitude: 77.0098,
          },
          status: 'open',
          priority: 'high',
          timeline: [
            { status: 'open', time: new Date(Date.now() - 3600000 * 8), note: 'Complaint registered in Peelamedu – Avinashi Road Zone' },
          ],
        },
        {
          citizen: karthikCitizen?._id || aravindCitizen?._id,
          title: 'Missed Door-to-Door Collection at Pudur 2nd Street',
          category: 'Missed Collection',
          description: 'Morning collection vehicle missed Pudur 2nd Street today.',
          area: 'Peelamedu',
          zone: 'Peelamedu – Hope College Zone',
          street: 'Pudur 2nd Street',
          location: {
            address: 'Pudur 2nd Street, Peelamedu',
            latitude: 11.0268,
            longitude: 77.0055,
          },
          status: 'resolved',
          priority: 'medium',
          assignedDriver: selvamDriver?._id || null,
          timeline: [
            { status: 'open', time: new Date(Date.now() - 86400000), note: 'Complaint registered' },
            { status: 'resolved', time: new Date(Date.now() - 3600000 * 2), note: 'Special pickup completed by driver Selvam K' },
          ],
        },
        {
          citizen: aravindCitizen?._id,
          title: 'Accumulated Waste on Peelamedu Colony 3rd Street',
          category: 'Overflowing Bin',
          description: 'Three bins on Peelamedu Colony 3rd Street are completely full.',
          area: 'Peelamedu',
          zone: 'Peelamedu – PSG Zone',
          street: 'Peelamedu Colony 3rd Street',
          location: {
            address: 'Peelamedu Colony 3rd Street, Peelamedu',
            latitude: 11.0234,
            longitude: 77.0047,
          },
          status: 'open',
          priority: 'high',
          timeline: [
            { status: 'open', time: new Date(Date.now() - 3600000 * 3), note: 'Complaint registered by resident' },
          ],
        },
      ]);
    }

    // Ensure historical resolved complaints exist for driver completion metrics
    const resolvedCount = await Complaint.countDocuments({ status: { $in: ['resolved', 'closed'] } });
    if (resolvedCount < 50 && muruganDriver && aravindCitizen) {
      const historicalComplaints = [];
      const categories = ['Overflowing Bin', 'Missed Collection', 'Illegal Dumping', 'Street Sweeping', 'Damaged Bin'];
      const streets = ['PSG Tech College Road', 'Peelamedu Colony 1st Street', 'Peelamedu Colony 2nd Street', 'Peelamedu Colony 3rd Street', 'Hope College Junction Road', 'Pudur 2nd Street'];
      
      const driversList = [
        { driver: muruganDriver, month1: 12, month3: 26, month6: 33, year1: 74, zone: 'Peelamedu – PSG Zone' },
        { driver: selvamDriver, month1: 9, month3: 18, month6: 28, year1: 52, zone: 'Peelamedu – Hope College Zone' },
        { driver: praveenDriver, month1: 7, month3: 15, month6: 22, year1: 41, zone: 'Peelamedu – Avinashi Road Zone' },
      ];

      for (const d of driversList) {
        if (!d.driver) continue;
        // 1-30 days ago (Last 1 Month)
        for (let i = 0; i < d.month1; i++) {
          const daysAgo = 1 + Math.floor(Math.random() * 28);
          const resolvedDate = new Date(Date.now() - daysAgo * 86400000);
          const cat = categories[i % categories.length];
          const st = streets[i % streets.length];
          historicalComplaints.push({
            citizen: aravindCitizen._id,
            title: `${cat} - ${st}`,
            category: cat,
            description: `Resolved complaint for ${st}`,
            area: 'Peelamedu',
            zone: d.zone,
            street: st,
            location: { address: `${st}, Peelamedu`, latitude: 11.0244, longitude: 77.0028 },
            status: 'resolved',
            priority: 'medium',
            assignedDriver: d.driver._id,
            createdAt: new Date(resolvedDate.getTime() - 86400000),
            updatedAt: resolvedDate,
            timeline: [
              { status: 'open', time: new Date(resolvedDate.getTime() - 86400000), note: 'Complaint logged' },
              { status: 'assigned', time: new Date(resolvedDate.getTime() - 43200000), note: `Assigned to ${d.driver.name}` },
              { status: 'resolved', time: resolvedDate, note: `Resolved by ${d.driver.name}` },
            ],
          });
        }

        // 31-90 days ago (for Last 3 Months total)
        for (let i = 0; i < (d.month3); i++) {
          const daysAgo = 31 + Math.floor(Math.random() * 58);
          const resolvedDate = new Date(Date.now() - daysAgo * 86400000);
          const cat = categories[i % categories.length];
          const st = streets[i % streets.length];
          historicalComplaints.push({
            citizen: aravindCitizen._id,
            title: `${cat} - ${st}`,
            category: cat,
            description: `Resolved complaint for ${st}`,
            area: 'Peelamedu',
            zone: d.zone,
            street: st,
            location: { address: `${st}, Peelamedu`, latitude: 11.0244, longitude: 77.0028 },
            status: 'resolved',
            priority: 'medium',
            assignedDriver: d.driver._id,
            createdAt: new Date(resolvedDate.getTime() - 86400000),
            updatedAt: resolvedDate,
            timeline: [
              { status: 'open', time: new Date(resolvedDate.getTime() - 86400000), note: 'Complaint logged' },
              { status: 'assigned', time: new Date(resolvedDate.getTime() - 43200000), note: `Assigned to ${d.driver.name}` },
              { status: 'resolved', time: resolvedDate, note: `Resolved by ${d.driver.name}` },
            ],
          });
        }

        // 91-180 days ago (for Last 6 Months total)
        for (let i = 0; i < (d.month6); i++) {
          const daysAgo = 91 + Math.floor(Math.random() * 88);
          const resolvedDate = new Date(Date.now() - daysAgo * 86400000);
          const cat = categories[i % categories.length];
          const st = streets[i % streets.length];
          historicalComplaints.push({
            citizen: aravindCitizen._id,
            title: `${cat} - ${st}`,
            category: cat,
            description: `Resolved complaint for ${st}`,
            area: 'Peelamedu',
            zone: d.zone,
            street: st,
            location: { address: `${st}, Peelamedu`, latitude: 11.0244, longitude: 77.0028 },
            status: 'resolved',
            priority: 'medium',
            assignedDriver: d.driver._id,
            createdAt: new Date(resolvedDate.getTime() - 86400000),
            updatedAt: resolvedDate,
            timeline: [
              { status: 'open', time: new Date(resolvedDate.getTime() - 86400000), note: 'Complaint logged' },
              { status: 'assigned', time: new Date(resolvedDate.getTime() - 43200000), note: `Assigned to ${d.driver.name}` },
              { status: 'resolved', time: resolvedDate, note: `Resolved by ${d.driver.name}` },
            ],
          });
        }

        // 181-365 days ago (for Last 1 Year total)
        for (let i = 0; i < (d.year1); i++) {
          const daysAgo = 181 + Math.floor(Math.random() * 180);
          const resolvedDate = new Date(Date.now() - daysAgo * 86400000);
          const cat = categories[i % categories.length];
          const st = streets[i % streets.length];
          historicalComplaints.push({
            citizen: aravindCitizen._id,
            title: `${cat} - ${st}`,
            category: cat,
            description: `Resolved complaint for ${st}`,
            area: 'Peelamedu',
            zone: d.zone,
            street: st,
            location: { address: `${st}, Peelamedu`, latitude: 11.0244, longitude: 77.0028 },
            status: 'resolved',
            priority: 'medium',
            assignedDriver: d.driver._id,
            createdAt: new Date(resolvedDate.getTime() - 86400000),
            updatedAt: resolvedDate,
            timeline: [
              { status: 'open', time: new Date(resolvedDate.getTime() - 86400000), note: 'Complaint logged' },
              { status: 'assigned', time: new Date(resolvedDate.getTime() - 43200000), note: `Assigned to ${d.driver.name}` },
              { status: 'resolved', time: resolvedDate, note: `Resolved by ${d.driver.name}` },
            ],
          });
        }
      }

      if (historicalComplaints.length > 0) {
        await Complaint.insertMany(historicalComplaints);
        console.log(`✅ Seeded ${historicalComplaints.length} historical resolved complaints for drivers`);
      }
    }

    // 6. Schedules (Per Zone & Street List)
    const scheduleCount = await Schedule.countDocuments();
    if (scheduleCount === 0) {
      await Schedule.insertMany([
        {
          area: 'Peelamedu',
          zone: 'Peelamedu – PSG Zone',
          streets: [
            'PSG Tech College Road',
            'Peelamedu Colony 1st Street',
            'Peelamedu Colony 2nd Street',
            'Peelamedu Colony 3rd Street',
            'Peelamedu Colony 4th Street',
            'Peelamedu Cross Road',
          ],
          type: 'General Waste',
          dayOfWeek: [1, 4],
          scheduleDay: 'Monday & Thursday',
          timeSlot: '7:00 AM - 10:00 AM',
          vehicleId: 'GCT-001',
          driver: muruganDriver?._id || null,
          color: '#2E7D32',
          icon: 'trash-can',
          isActive: true,
        },
        {
          area: 'Peelamedu',
          zone: 'Peelamedu – Hope College Zone',
          streets: [
            'Hope College Junction Road',
            'Selvampathy Nagar 1st Street',
            'Selvampathy Nagar 2nd Street',
            'Selvampathy Nagar 3rd Street',
            'Pudur 2nd Street',
            'Pudur Main Road Service Lane',
          ],
          type: 'Recyclables',
          dayOfWeek: [2, 5],
          scheduleDay: 'Tuesday & Friday',
          timeSlot: '8:00 AM - 11:00 AM',
          vehicleId: 'JCB-001',
          driver: selvamDriver?._id || null,
          color: '#1565C0',
          icon: 'recycle',
          isActive: true,
        },
        {
          area: 'Peelamedu',
          zone: 'Peelamedu – Avinashi Road Zone',
          streets: [
            'Avinashi Road Commercial Corridor',
            'Fun Republic Mall Service Road',
            'GR Damodaran Road',
            'Tidel Park IT Corridor Road',
            'Aerodrome Road',
            'Neelikonampalayam 1st Street',
          ],
          type: 'Organic Waste',
          dayOfWeek: [3, 6],
          scheduleDay: 'Wednesday & Saturday',
          timeSlot: '7:30 AM - 10:30 AM',
          vehicleId: 'ML-001',
          driver: praveenDriver?._id || null,
          color: '#E65100',
          icon: 'leaf',
          isActive: true,
        },
      ]);
      console.log('✅ Seeded Peelamedu zone schedules');
    }

    // 7. Today's Route for Murugan S (Street-by-street for Peelamedu – PSG Zone)
    const today = new Date().toISOString().split('T')[0];
    if (muruganDriver) {
      const existingRoute = await Route.findOne({ driver: muruganDriver._id, date: today });
      if (!existingRoute) {
        const psgZone = PEELAMEDU_ZONES[0];
        await Route.create({
          driver: muruganDriver._id,
          vehicleId: 'GCT-001',
          zoneName: psgZone.name,
          area: 'Peelamedu',
          date: today,
          status: 'active',
          startedAt: new Date(Date.now() - 3600000 * 2),
          stops: psgZone.streets.map((st, idx) => ({
            stopNumber: st.stopNumber,
            address: st.address,
            area: psgZone.name,
            street: st.name,
            landmark: st.landmark,
            binType: st.binType,
            housesCount: st.housesCount,
            latitude: st.latitude,
            longitude: st.longitude,
            status: idx < 2 ? 'completed' : idx === 2 ? 'in_progress' : 'pending',
            completedAt: idx < 2 ? new Date(Date.now() - 3600000 * (2 - idx)) : null,
          })),
        });
        console.log('✅ Seeded active street-by-street route for Murugan S in Peelamedu – PSG Zone');
      }
    }
  } catch (err) {
    console.error('Seed data error:', err.message);
  }
}
