// City-level pages inside a metro. Start with markets where you actually buy, and add more one line at a time.
// [slug, city, state, parent metro slug, county, main roads, what is nearby]
// Keep to facts that can be checked on a map.
const rows = [
  ['pasadena-tx', 'Pasadena', 'TX', 'houston-tx', 'Harris County', ['SH 225', 'Beltway 8', 'Red Bluff Road'], 'the Houston Ship Channel and the Bayport industrial district'],
  ['la-porte-tx', 'La Porte', 'TX', 'houston-tx', 'Harris County', ['SH 146', 'SH 225', 'Fairmont Parkway'], 'the Barbours Cut and Bayport container terminals'],
  ['deer-park-tx', 'Deer Park', 'TX', 'houston-tx', 'Harris County', ['SH 225', 'Beltway 8'], 'the Houston Ship Channel plants and terminals'],
  ['baytown-tx', 'Baytown', 'TX', 'houston-tx', 'Harris and Chambers Counties', ['I-10 East', 'SH 146', 'the Grand Parkway (SH 99)'], 'Cedar Port Industrial Park and the east side of the Ship Channel'],
  ['channelview-tx', 'Channelview', 'TX', 'houston-tx', 'Harris County', ['I-10 East', 'Beltway 8 East'], 'the north bank of the Houston Ship Channel'],
  ['galena-park-jacinto-city-tx', 'Galena Park & Jacinto City', 'TX', 'houston-tx', 'Harris County', ['I-10 East', 'Loop 610 East', 'Clinton Drive'], 'the Port Houston Turning Basin terminals'],
  ['northwest-houston-tx', 'Northwest Houston', 'TX', 'houston-tx', 'Harris County', ['US-290', 'Beltway 8', 'Hempstead Road'], 'Jersey Village and the US-290 industrial corridor'],
  ['north-houston-tx', 'North Houston & Spring', 'TX', 'houston-tx', 'Harris County', ['I-45 North', 'Beltway 8', 'the Hardy Toll Road'], 'Bush Intercontinental Airport'],
  ['humble-tx', 'Humble', 'TX', 'houston-tx', 'Harris County', ['I-69 / US-59 North', 'Beltway 8', 'FM 1960'], 'Bush Intercontinental Airport'],
  ['tomball-tx', 'Tomball', 'TX', 'houston-tx', 'Harris County', ['SH 249', 'the Grand Parkway (SH 99)', 'FM 2920'], 'the northwest Harris County industrial parks'],
  ['conroe-tx', 'Conroe', 'TX', 'houston-tx', 'Montgomery County', ['I-45 North', 'Loop 336', 'SH 105'], 'Conroe Park North and Conroe-North Houston Regional Airport'],
  ['katy-tx', 'Katy & Brookshire', 'TX', 'houston-tx', 'Harris, Fort Bend and Waller Counties', ['I-10 West', 'the Grand Parkway (SH 99)'], 'the I-10 West distribution corridor'],
  ['stafford-tx', 'Stafford', 'TX', 'houston-tx', 'Fort Bend County', ['I-69 / US-59 South', 'US-90A', 'Beltway 8'], 'the southwest Houston flex and light industrial parks'],
  ['sugar-land-missouri-city-tx', 'Sugar Land & Missouri City', 'TX', 'houston-tx', 'Fort Bend County', ['I-69 / US-59 South', 'US-90A', 'the Fort Bend Parkway'], 'the Fort Bend County business parks'],
  ['rosenberg-tx', 'Rosenberg & Richmond', 'TX', 'houston-tx', 'Fort Bend County', ['I-69 / US-59 South', 'SH 36', 'US-90A'], 'the southwest Fort Bend County industrial sites'],
  ['pearland-tx', 'Pearland', 'TX', 'houston-tx', 'Brazoria County', ['SH 288', 'Beltway 8 South', 'SH 35'], 'the south Houston industrial parks'],
  ['texas-city-tx', 'Texas City', 'TX', 'houston-tx', 'Galveston County', ['I-45 South', 'SH 146', 'Loop 197'], 'the Port of Texas City'],
  ['freeport-tx', 'Freeport', 'TX', 'houston-tx', 'Brazoria County', ['SH 288', 'SH 36', 'SH 332'], 'Port Freeport'],
];

export const submarkets = rows.map(([slug, name, st, metro, county, roads, near]) => ({
  slug: `sell-warehouse-${slug}`,
  name,
  st,
  label: `${name}, ${st}`,
  metro: `sell-warehouse-${metro}`,
  county,
  roads,
  near,
}));
