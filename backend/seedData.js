import User from './models/User.js';
import Driver from './models/Driver.js';
import Citizen from './models/Citizen.js';
import Vehicle from './models/Vehicle.js';
import Complaint from './models/Complaint.js';
import Route from './models/Route.js';
import Schedule from './models/Schedule.js';

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

    // 2. Drivers
    const driverCount = await Driver.countDocuments();
    let muruganDriver = null;
    let selvamDriver = null;

    if (driverCount === 0) {
      muruganDriver = await Driver.create({
        name: 'Murugan S',
        email: 'murugan.s@cleanconnect.gov.in',
        password: 'driver123',
        phone: '+91 87654 32109',
        employeeId: 'EMP-2024-056',
        zone: 'Zone A - Peelamedu (PSG)',
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
        zone: 'Zone B - Peelamedu (Avinashi Rd)',
        vehicleId: 'JCB-001',
        shift: '7:00 AM - 3:00 PM',
        joiningDate: 'July 2023',
      });

      await Driver.create({
        name: 'Praveen Kumar',
        email: 'praveen.k@cleanconnect.gov.in',
        password: 'driver123',
        phone: '+91 98403 45678',
        employeeId: 'EMP-2024-058',
        zone: 'Zone C - Peelamedu (Tidel Park)',
        vehicleId: 'ML-001',
        shift: '2:00 PM - 10:00 PM',
        joiningDate: 'January 2024',
      });

      await Driver.create({
        name: 'Muthu Raj',
        email: 'muthu.r@cleanconnect.gov.in',
        password: 'driver123',
        phone: '+91 98404 56789',
        employeeId: 'EMP-2024-059',
        zone: 'Zone A - Peelamedu',
        vehicleId: 'RS-001',
        shift: '10:00 PM - 6:00 AM',
        joiningDate: 'May 2024',
      });

      console.log('✅ Seeded 4 Peelamedu drivers');
    } else {
      muruganDriver = await Driver.findOne({ email: 'murugan.s@cleanconnect.gov.in' });
      selvamDriver = await Driver.findOne({ email: 'selvam.k@cleanconnect.gov.in' });
    }

    // 3. Vehicles
    const vehicleCount = await Vehicle.countDocuments();
    if (vehicleCount === 0) {
      await Vehicle.insertMany([
        {
          vehicleId: 'GCT-001',
          type: 'garbage_truck',
          plateNumber: 'TN-38-AA-1234',
          capacity: '5 Tonnes Compactor',
          assignedDriver: muruganDriver?._id || null,
          currentArea: 'PSG College Main Gate, Peelamedu',
          status: 'active',
          fuelLevel: 82,
          lastMaintenance: new Date('2026-03-01'),
        },
        {
          vehicleId: 'JCB-001',
          type: 'jcb',
          plateNumber: 'TN-38-JC-4501',
          capacity: 'Heavy Dump Clearance',
          assignedDriver: selvamDriver?._id || null,
          currentArea: 'Fun Republic Mall back dump, Peelamedu',
          status: 'active',
          fuelLevel: 65,
          lastMaintenance: new Date('2026-02-15'),
        },
        {
          vehicleId: 'ML-001',
          type: 'mini_loader',
          plateNumber: 'TN-38-ML-8820',
          capacity: '1.5 Tonnes Loader',
          assignedDriver: null,
          currentArea: 'Tidel Park Service Road, Peelamedu',
          status: 'active',
          fuelLevel: 45,
          lastMaintenance: new Date('2026-03-10'),
        },
        {
          vehicleId: 'RS-001',
          type: 'road_sweeper',
          plateNumber: 'TN-38-RS-3319',
          capacity: 'Vacuum Sweeper',
          assignedDriver: null,
          currentArea: 'Avinashi Road Peelamedu corridor',
          status: 'maintenance',
          fuelLevel: 18,
          lastMaintenance: new Date('2026-03-18'),
        },
      ]);
      console.log('✅ Seeded Peelamedu machinery & trucks fleet');
    }

    // 4. Citizens
    const citizenCount = await Citizen.countDocuments();
    let aravindCitizen = null;
    let priyaCitizen = null;

    if (citizenCount === 0) {
      aravindCitizen = await Citizen.create({
        name: 'Aravind Kumar',
        email: 'aravind.kumar@email.com',
        password: 'password123',
        phone: '+91 94876 54321',
        area: 'Peelamedu Main Road',
        address: '12, Avinashi Road, Peelamedu, Coimbatore - 641004',
      });

      priyaCitizen = await Citizen.create({
        name: 'Priya Raman',
        email: 'priya.raman@email.com',
        password: 'password123',
        phone: '+91 98450 12345',
        area: 'PSG College Area',
        address: '45, College Road, Peelamedu, Coimbatore - 641004',
      });

      await Citizen.create({
        name: 'Karthik Sundaram',
        email: 'karthik.s@email.com',
        password: 'password123',
        phone: '+91 97123 45678',
        area: 'Tidel Park / Aerodrome Road',
        address: '8, Aerodrome Road, Peelamedu, Coimbatore - 641014',
      });

      await Citizen.create({
        name: 'Deepa Lakshmi',
        email: 'deepa.l@email.com',
        password: 'password123',
        phone: '+91 96234 56789',
        area: 'Peelamedu Pudur',
        address: '23, Pudur 2nd Street, Peelamedu, Coimbatore - 641004',
      });

      console.log('✅ Seeded 4 Peelamedu citizens');
    } else {
      aravindCitizen = await Citizen.findOne({ email: 'aravind.kumar@email.com' });
      priyaCitizen = await Citizen.findOne({ email: 'priya.raman@email.com' });
    }

    // 5. Complaints
    const complaintCount = await Complaint.countDocuments();
    if (complaintCount === 0 && (aravindCitizen || priyaCitizen)) {
      await Complaint.insertMany([
        {
          citizen: aravindCitizen?._id || priyaCitizen?._id,
          title: 'Overflowing Bin near PSG Tech Gate',
          category: 'Overflowing Bin',
          description: 'The community bin at PSG College Main Gate on Avinashi Road is overflowing. Waste spilling onto footpath.',
          location: {
            address: 'Avinashi Road, near PSG Tech Gate, Peelamedu',
            latitude: 11.0244,
            longitude: 77.0028,
          },
          status: 'in_progress',
          priority: 'high',
          assignedDriver: muruganDriver?._id || null,
          timeline: [
            { status: 'open', time: new Date(Date.now() - 3600000 * 5), note: 'Complaint registered by citizen' },
            { status: 'assigned', time: new Date(Date.now() - 3600000 * 3), note: 'Assigned to driver Murugan S (GCT-001)' },
            { status: 'in_progress', time: new Date(Date.now() - 3600000 * 1), note: 'Driver en route for pickup' },
          ],
        },
        {
          citizen: priyaCitizen?._id || aravindCitizen?._id,
          title: 'Illegal Dumping behind Fun Republic Mall',
          category: 'Illegal Dumping',
          description: 'Large commercial dump piled up near service lane. Heavy machinery required for clearing.',
          location: {
            address: 'Fun Republic Mall Back Lane, Peelamedu',
            latitude: 11.0255,
            longitude: 77.0098,
          },
          status: 'open',
          priority: 'high',
          timeline: [
            { status: 'open', time: new Date(Date.now() - 3600000 * 8), note: 'Complaint submitted with photo evidence' },
          ],
        },
        {
          citizen: aravindCitizen?._id,
          title: 'Missed Door-to-Door Collection at Peelamedu Pudur',
          category: 'Missed Collection',
          description: 'Morning collection vehicle did not cover Pudur 2nd street today.',
          location: {
            address: 'Pudur 2nd Street, Peelamedu',
            latitude: 11.0268,
            longitude: 77.0055,
          },
          status: 'resolved',
          priority: 'medium',
          assignedDriver: muruganDriver?._id || null,
          timeline: [
            { status: 'open', time: new Date(Date.now() - 86400000), note: 'Complaint registered' },
            { status: 'resolved', time: new Date(Date.now() - 3600000 * 2), note: 'Special pickup completed by driver' },
          ],
        },
      ]);
      console.log('✅ Seeded initial Peelamedu complaints');
    }

    // 6. Schedules
    const scheduleCount = await Schedule.countDocuments();
    if (scheduleCount === 0) {
      await Schedule.insertMany([
        { area: 'Peelamedu Main Road & PSG Area', zone: 'Zone A', type: 'General Waste', dayOfWeek: [1, 4], timeSlot: '7:00 AM - 10:00 AM', vehicleId: 'GCT-001', color: '#2E7D32', icon: 'trash-can' },
        { area: 'Peelamedu Pudur & GRD Academy', zone: 'Zone B', type: 'Recyclables', dayOfWeek: [2, 5], timeSlot: '8:00 AM - 11:00 AM', vehicleId: 'GCT-002', color: '#1565C0', icon: 'recycle' },
        { area: 'Avinashi Road & Tidel Park Corridor', zone: 'Zone C', type: 'Organic Waste', dayOfWeek: [3, 6], timeSlot: '7:30 AM - 10:30 AM', vehicleId: 'GCT-001', color: '#E65100', icon: 'leaf' },
      ]);
      console.log('✅ Seeded Peelamedu schedules');
    }

    // 7. Today's Route for driver
    const today = new Date().toISOString().split('T')[0];
    const routeExists = await Route.findOne({ date: today });
    if (!routeExists && muruganDriver) {
      await Route.create({
        driver: muruganDriver._id,
        vehicleId: 'GCT-001',
        date: today,
        status: 'active',
        startedAt: new Date(Date.now() - 3600000 * 2),
        stops: [
          { stopNumber: 1, address: 'PSG College Main Gate, Peelamedu', area: 'Peelamedu', landmark: 'Near PSG Tech Entrance', latitude: 11.0244, longitude: 77.0028, status: 'completed', completedAt: new Date(Date.now() - 3600000) },
          { stopNumber: 2, address: 'Fun Republic Mall, Avinashi Road', area: 'Peelamedu', landmark: 'Front Service Road', latitude: 11.0255, longitude: 77.0098, status: 'in_progress' },
          { stopNumber: 3, address: 'GR Damodaran Academy, Peelamedu', area: 'Peelamedu', landmark: 'School Bus Bay', latitude: 11.0280, longitude: 77.0142, status: 'pending' },
          { stopNumber: 4, address: 'Tidel Park IT Corridor, Peelamedu', area: 'Peelamedu', landmark: 'Tidel Park Main Gate', latitude: 11.0298, longitude: 77.0264, status: 'pending' },
          { stopNumber: 5, address: 'Peelamedu Pudur Bus Stop', area: 'Peelamedu', landmark: 'Opposite Pudur Market', latitude: 11.0268, longitude: 77.0055, status: 'pending' },
        ],
      });
      console.log('✅ Seeded today route for Murugan S in Peelamedu');
    }
  } catch (err) {
    console.error('Seed data error:', err.message);
  }
}
