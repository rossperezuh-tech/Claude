import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "demo1234";

function ymd(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(d);
}

async function main() {
  const pw = hashPassword(DEMO_PASSWORD);

  // --- Gyms ---
  const gymDefs = [
    {
      email: "gym.southshore@example.com",
      name: "Maria Santos",
      gymName: "South Shore Combat Club",
      address: "4220 Arthur Kill Rd, Units 9 & 10",
      borough: "Staten Island",
      description:
        "3,000 sq ft of mats, full ring, and 12 heavy bags on the South Shore. Off-peak mat time available to independent coaches mornings and early afternoons.",
      amenities: "Boxing ring, 12 heavy bags, full mat floor, showers, parking",
      spaceSharePct: 20,
    },
    {
      email: "gym.bayridge@example.com",
      name: "Tony Marchetti",
      gymName: "Bay Ridge Boxing & MMA",
      address: "9312 4th Ave",
      borough: "Brooklyn",
      description:
        "Classic boxing gym with a modern MMA cage. We love hosting independent coaches — our space sits empty 10am–4pm and it shouldn't.",
      amenities: "Cage, ring, bags, strength area, lockers",
      spaceSharePct: 25,
    },
    {
      email: "gym.lic@example.com",
      name: "Dana Kim",
      gymName: "LIC Grapple House",
      address: "27-11 44th Dr",
      borough: "Queens",
      description:
        "Dedicated grappling facility in Long Island City — 2,400 sq ft of Zebra mats. Perfect for BJJ and wrestling coaches building a private client base.",
      amenities: "Zebra mats, showers, sauna, lounge",
      spaceSharePct: 15,
    },
  ];

  const gyms = [];
  for (const g of gymDefs) {
    const user = await prisma.user.create({
      data: {
        email: g.email,
        passwordHash: pw,
        name: g.name,
        role: "GYM",
        gymProfile: {
          create: {
            gymName: g.gymName,
            address: g.address,
            borough: g.borough,
            description: g.description,
            amenities: g.amenities,
            spaceSharePct: g.spaceSharePct,
          },
        },
      },
      include: { gymProfile: true },
    });
    gyms.push(user.gymProfile!);
  }

  // --- Coaches ---
  const coachDefs = [
    {
      email: "coach.marco@example.com",
      name: "Marco DeLuca",
      displayName: "Marco DeLuca",
      discipline: "Muay Thai",
      borough: "Staten Island",
      yearsExperience: 12,
      accolades: "Former WKA North American champion · 24-3 pro record",
      bio: "Twelve years fighting and coaching Muay Thai. I run technical pad sessions and fight-camp style conditioning. My students range from first-timers to amateur fighters prepping for bouts.",
    },
    {
      email: "coach.aisha@example.com",
      name: "Aisha Thompson",
      displayName: "Aisha Thompson",
      discipline: "Boxing",
      borough: "Brooklyn",
      yearsExperience: 9,
      accolades: "NY Golden Gloves finalist · USA Boxing certified",
      bio: "Golden Gloves finalist turned coach. I teach fundamentals-first boxing — footwork, defense, and real punch mechanics. Great with beginners and clients training for their first white-collar bout.",
    },
    {
      email: "coach.viktor@example.com",
      name: "Viktor Petrov",
      displayName: "Viktor Petrov",
      discipline: "BJJ",
      borough: "Queens",
      yearsExperience: 15,
      accolades: "BJJ black belt (3rd degree) · IBJJF Masters medalist",
      bio: "Black belt with 15 years on the mats. Private and small-group BJJ focused on pressure passing and leg locks. No-gi and gi. All levels welcome, competitors get fight-week game planning.",
    },
    {
      email: "coach.jen@example.com",
      name: "Jen Alvarez",
      displayName: "Jen Alvarez",
      discipline: "MMA",
      borough: "Staten Island",
      yearsExperience: 7,
      accolades: "5-1 amateur MMA · Certified strength coach",
      bio: "MMA generalist — striking into takedowns into ground work in one session. I coach fighters and everyday athletes who want the full toolkit without joining three different gyms.",
    },
  ];

  const coaches = [];
  for (const c of coachDefs) {
    const user = await prisma.user.create({
      data: {
        email: c.email,
        passwordHash: pw,
        name: c.name,
        role: "COACH",
        coachProfile: {
          create: {
            displayName: c.displayName,
            discipline: c.discipline,
            borough: c.borough,
            yearsExperience: c.yearsExperience,
            accolades: c.accolades,
            bio: c.bio,
          },
        },
      },
      include: { coachProfile: true },
    });
    coaches.push(user.coachProfile!);
  }

  const [southShore, bayRidge, lic] = gyms;
  const [marco, aisha, viktor, jen] = coaches;

  // --- Partnerships ---
  const approved = [
    { coachId: marco.id, gymId: southShore.id },
    { coachId: marco.id, gymId: bayRidge.id },
    { coachId: aisha.id, gymId: bayRidge.id },
    { coachId: viktor.id, gymId: lic.id },
    { coachId: jen.id, gymId: southShore.id },
  ];
  for (const p of approved) {
    await prisma.partnership.create({ data: { ...p, status: "APPROVED" } });
  }
  // A pending request so the gym dashboard has something to act on
  await prisma.partnership.create({
    data: {
      coachId: viktor.id,
      gymId: southShore.id,
      status: "PENDING",
      message:
        "Hi — I have a growing Staten Island client list and would love Sunday morning mat time for no-gi sessions.",
    },
  });

  // --- Session listings over the next two weeks ---
  const listingDefs = [
    { coach: marco, gym: southShore, title: "Muay Thai Pads & Clinch", description: "60 minutes of pad rounds, clinch entries, and sweeps. Bring gloves and shins if you have them.", discipline: "Muay Thai", day: 2, startTime: "10:00", endTime: "11:00", price: 6000, capacity: 8 },
    { coach: marco, gym: southShore, title: "Fight Camp Conditioning", description: "Fight-camp style circuit: bag rounds, sprints, core. All levels, scaled to you.", discipline: "Muay Thai", day: 4, startTime: "10:00", endTime: "11:00", price: 4500, capacity: 12 },
    { coach: marco, gym: bayRidge, title: "Dutch-Style Kickboxing Sparring", description: "Technical sparring for experienced students. 16oz gloves and shin guards required.", discipline: "Muay Thai", day: 6, startTime: "13:00", endTime: "14:00", price: 5000, capacity: 10 },
    { coach: aisha, gym: bayRidge, title: "Boxing Fundamentals", description: "Stance, jab, footwork. The unglamorous stuff that wins rounds. Perfect for beginners.", discipline: "Boxing", day: 1, startTime: "11:00", endTime: "12:00", price: 5000, capacity: 10 },
    { coach: aisha, gym: bayRidge, title: "Mitts & Defense Small Group", description: "Max 6 people — everyone gets real mitt time. Slips, rolls, counters.", discipline: "Boxing", day: 3, startTime: "11:00", endTime: "12:00", price: 7500, capacity: 6 },
    { coach: viktor, gym: lic, title: "No-Gi Pressure Passing", description: "A systematic passing session: body lock to half smash. Drilling plus positional rounds.", discipline: "BJJ", day: 2, startTime: "12:00", endTime: "13:30", price: 6500, capacity: 12 },
    { coach: viktor, gym: lic, title: "Leg Lock Fundamentals", description: "Ashi garami entries, breaking mechanics, and staying safe. No-gi.", discipline: "BJJ", day: 5, startTime: "12:00", endTime: "13:30", price: 6500, capacity: 12 },
    { coach: jen, gym: southShore, title: "MMA All-In-One", description: "Striking to takedown to ground-and-pound in one flow. Gloves provided.", discipline: "MMA", day: 3, startTime: "09:00", endTime: "10:00", price: 5500, capacity: 10 },
    { coach: jen, gym: southShore, title: "Takedowns for Strikers", description: "Level changes, double legs, and takedown defense for people who'd rather stay standing.", discipline: "MMA", day: 8, startTime: "09:00", endTime: "10:00", price: 5500, capacity: 10 },
  ];

  const listings = [];
  for (const l of listingDefs) {
    const listing = await prisma.sessionListing.create({
      data: {
        coachId: l.coach.id,
        gymId: l.gym.id,
        title: l.title,
        description: l.description,
        discipline: l.discipline,
        date: ymd(l.day),
        startTime: l.startTime,
        endTime: l.endTime,
        priceCents: l.price,
        capacity: l.capacity,
      },
    });
    listings.push({ listing, gym: l.gym });
  }

  // --- A few confirmed bookings so dashboards show earnings ---
  const clients = [
    { name: "Chris Romano", email: "chris.r@example.com" },
    { name: "Dee Park", email: "dee.park@example.com" },
    { name: "Sam Okafor", email: "sam.o@example.com" },
    { name: "Lena Vitale", email: "lena.v@example.com" },
    { name: "Pat Muller", email: "pat.m@example.com" },
  ];
  const PLATFORM_FEE_PCT = 10;
  let ci = 0;
  for (const { listing, gym } of listings.slice(0, 5)) {
    const bookingsForListing = ci % 2 === 0 ? 2 : 1;
    for (let i = 0; i < bookingsForListing; i++) {
      const client = clients[(ci + i) % clients.length];
      const gymCutCents = Math.round((listing.priceCents * gym.spaceSharePct) / 100);
      const platformFeeCents = Math.round((listing.priceCents * PLATFORM_FEE_PCT) / 100);
      await prisma.booking.create({
        data: {
          listingId: listing.id,
          clientName: client.name,
          clientEmail: client.email,
          priceCents: listing.priceCents,
          platformFeeCents,
          gymCutCents,
          coachNetCents: listing.priceCents - platformFeeCents - gymCutCents,
          status: "confirmed",
        },
      });
    }
    ci++;
  }

  console.log(
    `Seeded ${gyms.length} gyms, ${coaches.length} coaches, ${listings.length} sessions.`
  );
  console.log(`Demo login for every account: password "${DEMO_PASSWORD}"`);
  console.log(`Coach: coach.marco@example.com · Gym: gym.southshore@example.com`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
