// Helper to generate exact pixel bounding rectangles from official Nokia Go definitions

function buildD2LPorts() {
  const topRowX = [172, 233, 312, 374, 453, 514, 593, 655, 734, 795, 875, 936, 1015, 1077, 1156, 1217];
  const topY = 13;
  const midY = 73;
  const botY = 133;
  const w = 59;
  const hTop = 44;
  const hBot = 42;

  const ports = [];
  let portIndex = 1;

  for (let pair = 0; pair + 1 < topRowX.length; pair += 2) {
    const xLeft = topRowX[pair];
    const xRight = topRowX[pair + 1];

    const blockSpecs = [
      { x: xLeft, y: topY, h: hTop },
      { x: xLeft, y: midY, h: hTop },
      { x: xLeft, y: botY, h: hBot },
      { x: xRight, y: topY, h: hTop },
      { x: xRight, y: midY, h: hTop },
      { x: xRight, y: botY, h: hBot },
    ];

    blockSpecs.forEach(({ x, y, h }) => {
      ports.push({
        id: `e1/${portIndex}`,
        label: `25G #${portIndex}`,
        type: 'SFP28',
        speed: '25 Gbps',
        defaultStatus: portIndex % 3 === 0 ? 'UP' : 'UP',
        transceiver: '25G-SR Optical',
        pixelRect: { minX: x + 2, minY: y + 2, maxX: x + w - 2, maxY: y + h - 2 },
      });
      portIndex++;
    });
  }

  // Right side QSFP28 ports 49..56
  const qsfpRects = [
    { minX: 1379, minY: 77, maxX: 1464, maxY: 118 },
    { minX: 1379, minY: 135, maxX: 1464, maxY: 176 },
    { minX: 1465, minY: 77, maxX: 1550, maxY: 118 },
    { minX: 1465, minY: 135, maxX: 1550, maxY: 176 },
    { minX: 1568, minY: 77, maxX: 1653, maxY: 118 },
    { minX: 1568, minY: 135, maxX: 1653, maxY: 176 },
    { minX: 1654, minY: 77, maxX: 1739, maxY: 118 },
    { minX: 1654, minY: 135, maxX: 1739, maxY: 176 },
  ];

  qsfpRects.forEach((rect, idx) => {
    ports.push({
      id: `e1/${49 + idx}`,
      label: `100G #${idx + 1}`,
      type: 'QSFP28',
      speed: '100 Gbps',
      defaultStatus: 'UP',
      transceiver: '100G-CWDM4 Optical',
      pixelRect: rect,
    });
  });

  // Right side SFP+ ports 57..58
  ports.push(
    {
      id: 'e1/57',
      label: '10G #1',
      type: 'SFP+',
      speed: '10 Gbps',
      defaultStatus: 'UP',
      transceiver: '10G-SR Optical',
      pixelRect: { minX: 1759, minY: 13, maxX: 1819, maxY: 57 },
    },
    {
      id: 'e1/58',
      label: '10G #2',
      type: 'SFP+',
      speed: '10 Gbps',
      defaultStatus: 'UP',
      transceiver: '10G-SR Optical',
      pixelRect: { minX: 1759, minY: 73, maxX: 1819, maxY: 117 },
    }
  );

  return ports;
}

function buildD3LPorts() {
  const topRowX = [273, 359, 444, 530, 623, 709, 795, 881, 974, 1060, 1146, 1232, 1325, 1411, 1497, 1583];
  const topY = 62;
  const botY = 114;
  const w = 84;
  const h = 41;

  const ports = [];
  let portIndex = 1;

  for (let i = 0; i < topRowX.length; i++) {
    const x = topRowX[i];
    ports.push({
      id: `e1/${portIndex}`,
      label: `100G #${portIndex}`,
      type: 'QSFP28',
      speed: '100 Gbps',
      defaultStatus: 'UP',
      transceiver: '100G-SR4 Optical',
      pixelRect: { minX: x + 2, minY: topY + 2, maxX: x + w - 2, maxY: topY + h - 2 },
    });
    portIndex++;

    ports.push({
      id: `e1/${portIndex}`,
      label: `100G #${portIndex}`,
      type: 'QSFP28',
      speed: '100 Gbps',
      defaultStatus: 'UP',
      transceiver: '100G-SR4 Optical',
      pixelRect: { minX: x + 2, minY: botY + 2, maxX: x + w - 2, maxY: botY + h - 2 },
    });
    portIndex++;
  }

  ports.push(
    {
      id: 'e1/33',
      label: '10G #1',
      type: 'SFP+',
      speed: '10 Gbps',
      defaultStatus: 'UP',
      transceiver: '10G-LR Optical',
      pixelRect: { minX: 1751, minY: 63, maxX: 1809, maxY: 100 },
    },
    {
      id: 'e1/34',
      label: '10G #2',
      type: 'SFP+',
      speed: '10 Gbps',
      defaultStatus: 'UP',
      transceiver: '10G-LR Optical',
      pixelRect: { minX: 1751, minY: 116, maxX: 1809, maxY: 153 },
    }
  );

  return ports;
}

function buildD1Ports() {
  const topRowX = [
    150, 208, 267, 326, 385, 445, 516, 576, 635, 694, 754, 813, 895, 955, 1015, 1073, 1133, 1192, 1264, 1323, 1383, 1441, 1501, 1560
  ];
  const topY = 46;
  const botY = 107;
  const w = 53;
  const h = 46;

  const ports = [];
  let portIndex = 1;

  for (let i = 0; i < topRowX.length; i++) {
    const x = topRowX[i];
    ports.push({
      id: `e1/${portIndex}`,
      label: `10G RJ45 #${portIndex}`,
      type: 'RJ45',
      speed: '10 Gbps',
      defaultStatus: 'UP',
      transceiver: 'Cat6A Copper',
      pixelRect: { minX: x + 2, minY: topY + 2, maxX: x + w - 2, maxY: topY + h - 2 },
    });
    portIndex++;

    ports.push({
      id: `e1/${portIndex}`,
      label: `10G RJ45 #${portIndex}`,
      type: 'RJ45',
      speed: '10 Gbps',
      defaultStatus: 'UP',
      transceiver: 'Cat6A Copper',
      pixelRect: { minX: x + 2, minY: botY + 2, maxX: x + w - 2, maxY: botY + h - 2 },
    });
    portIndex++;
  }

  const uplinks = [
    { minX: 1636, minY: 130, maxX: 1695, maxY: 152 },
    { minX: 1697, minY: 130, maxX: 1756, maxY: 152 },
    { minX: 1772, minY: 130, maxX: 1831, maxY: 152 },
    { minX: 1833, minY: 130, maxX: 1892, maxY: 152 },
  ];

  uplinks.forEach((rect, idx) => {
    ports.push({
      id: `e1/${49 + idx}`,
      label: `25G #${idx + 1}`,
      type: 'SFP28',
      speed: '25 Gbps',
      defaultStatus: 'UP',
      transceiver: '25G-SR Optical',
      pixelRect: rect,
    });
  });

  return ports;
}

function buildD5Ports() {
  const topRowX = [247, 334, 435, 521, 624, 710, 812, 898, 1001, 1087, 1189, 1275, 1377, 1464, 1566, 1652];
  const topY = 60;
  const botY = 118;
  const w = 85;
  const h = 41;

  const ports = [];
  let portIndex = 1;

  for (let i = 0; i < topRowX.length; i++) {
    const x = topRowX[i];
    ports.push({
      id: `e1/${portIndex}`,
      label: `800G OSFP #${portIndex}`,
      type: 'OSFP',
      speed: '800 Gbps',
      defaultStatus: 'UP',
      transceiver: '800G-2xFR4 Optical',
      pixelRect: { minX: x + 2, minY: topY + 2, maxX: x + w - 2, maxY: topY + h - 2 },
    });
    portIndex++;

    ports.push({
      id: `e1/${portIndex}`,
      label: `800G OSFP #${portIndex}`,
      type: 'OSFP',
      speed: '800 Gbps',
      defaultStatus: 'UP',
      transceiver: '800G-2xFR4 Optical',
      pixelRect: { minX: x + 2, minY: botY + 2, maxX: x + w - 2, maxY: botY + h - 2 },
    });
    portIndex++;
  }

  ports.push(
    {
      id: 'e1/33',
      label: 'QSFP-DD #33',
      type: 'QSFP-DD',
      speed: '400 Gbps',
      defaultStatus: 'UP',
      transceiver: '400G-DR4',
      pixelRect: { minX: 1749, minY: 61, maxX: 1808, maxY: 98 },
    },
    {
      id: 'e1/34',
      label: 'QSFP-DD #34',
      type: 'QSFP-DD',
      speed: '400 Gbps',
      defaultStatus: 'UP',
      transceiver: '400G-DR4',
      pixelRect: { minX: 1749, minY: 119, maxX: 1808, maxY: 157 },
    }
  );

  return ports;
}

function buildSXR1X44SPorts() {
  const columns = [
    { x: 269, w: 58 }, { x: 329, w: 58 }, { x: 390, w: 58 }, { x: 450, w: 58 }, { x: 510, w: 58 }, { x: 571, w: 58 },
    { x: 672, w: 58 }, { x: 733, w: 58 }, { x: 793, w: 58 }, { x: 854, w: 58 }, { x: 930, w: 86 },
    { x: 1032, w: 58 }, { x: 1092, w: 58 }, { x: 1153, w: 58 }, { x: 1213, w: 58 },
    { x: 1314, w: 58 }, { x: 1374, w: 58 }, { x: 1435, w: 58 }, { x: 1495, w: 58 }, { x: 1556, w: 58 }, { x: 1616, w: 58 },
    { x: 1688, w: 85 }
  ];
  const topY = 47;
  const botY = 108;
  const h = 40;

  const ports = [];
  let pIdx = 1;

  columns.forEach((c) => {
    ports.push({
      id: `e1/${pIdx}`,
      label: `Port #${pIdx}`,
      type: c.w > 65 ? 'QSFP28' : 'SFP28',
      speed: c.w > 65 ? '100 Gbps' : '25 Gbps',
      defaultStatus: 'UP',
      transceiver: c.w > 65 ? '100G-SR4' : '25G-SR',
      pixelRect: { minX: c.x + 2, minY: topY + 2, maxX: c.x + c.w - 2, maxY: topY + h - 2 },
    });
    pIdx++;

    ports.push({
      id: `e1/${pIdx}`,
      label: `Port #${pIdx}`,
      type: c.w > 65 ? 'QSFP28' : 'SFP28',
      speed: c.w > 65 ? '100 Gbps' : '25 Gbps',
      defaultStatus: 'UP',
      transceiver: c.w > 65 ? '100G-SR4' : '25G-SR',
      pixelRect: { minX: c.x + 2, minY: botY + 2, maxX: c.x + c.w - 2, maxY: botY + h - 2 },
    });
    pIdx++;
  });

  return ports;
}

function buildA1Ports() {
  const topRowX = [
    178, 239, 299, 359, 419, 479, 540, 600, 682, 742, 802, 863, 922, 983, 1043, 1103, 1178, 1238, 1299, 1359, 1419, 1479, 1539, 1600
  ];
  const topY = 42;
  const botY = 106;
  const w = 53;
  const h = 48;

  const ports = [];
  let pIdx = 1;

  for (let i = 0; i < topRowX.length; i++) {
    const x = topRowX[i];
    ports.push({
      id: `e1/${pIdx}`,
      label: `10G #${pIdx}`,
      type: 'RJ45',
      speed: '10 Gbps',
      defaultStatus: 'UP',
      transceiver: 'Cat6A',
      pixelRect: { minX: x + 2, minY: topY + 2, maxX: x + w - 2, maxY: topY + h - 2 },
    });
    pIdx++;

    ports.push({
      id: `e1/${pIdx}`,
      label: `10G #${pIdx}`,
      type: 'RJ45',
      speed: '10 Gbps',
      defaultStatus: 'UP',
      transceiver: 'Cat6A',
      pixelRect: { minX: x + 2, minY: botY + 2, maxX: x + w - 2, maxY: botY + h - 2 },
    });
    pIdx++;
  }

  const uplinks = [
    { minX: 1670, minY: 45, maxX: 1729, maxY: 84 },
    { minX: 1670, minY: 113, maxX: 1729, maxY: 152 },
    { minX: 1731, minY: 45, maxX: 1790, maxY: 84 },
    { minX: 1731, minY: 113, maxX: 1790, maxY: 152 },
  ];

  uplinks.forEach((rect, idx) => {
    ports.push({
      id: `e1/${49 + idx}`,
      label: `25G #${idx + 1}`,
      type: 'SFP28',
      speed: '25 Gbps',
      defaultStatus: 'UP',
      transceiver: '25G-SR',
      pixelRect: rect,
    });
  });

  return ports;
}

export const SWITCH_MODELS = {
  'IXR-D2L': {
    id: 'IXR-D2L',
    name: 'Nokia 7220 IXR-D2L',
    series: '7220 IXR Line',
    heightU: 1, // 1 RU
    description: '1RU Data Center Switch with 48x 25G SFP28, 8x 100G QSFP28, and 2x 10G SFP+ ports. Powered by Nokia SR Linux.',
    powerWatts: 350,
    weightKg: 8.5,
    airflow: 'Front-to-Back (Port-Side Exhaust)',
    color: '#181b22',
    frontImage: '/images/7220-ixr-d2l.webp',
    accentColor: '#005aff',
    ports: buildD2LPorts(),
    rearModules: {
      psuCount: 2,
      fanTrayCount: 6,
      psuType: 'Hot-Swap 550W AC/DC',
      fanType: '6x N+1 Redundant Hot-Swap Fans',
    },
  },
  'IXR-D3L': {
    id: 'IXR-D3L',
    name: 'Nokia 7220 IXR-D3L',
    series: '7220 IXR Line',
    heightU: 1, // 1 RU
    description: '1RU High-Density Switch featuring 32x 100G QSFP28 ports and 2x 10G SFP+ ports for data center fabrics.',
    powerWatts: 580,
    weightKg: 9.8,
    airflow: 'Front-to-Back (Port-Side Exhaust)',
    color: '#141720',
    frontImage: '/images/7220-ixr-d3l.webp',
    accentColor: '#00c3ff',
    ports: buildD3LPorts(),
    rearModules: {
      psuCount: 2,
      fanTrayCount: 6,
      psuType: 'Hot-Swap 800W Titanium AC',
      fanType: 'High-Performance Fan Modules',
    },
  },
  'IXR-D2': {
    id: 'IXR-D2',
    name: 'Nokia 7220 IXR-D2',
    series: '7220 IXR Line',
    heightU: 1,
    description: '1RU Switch with 48x 25G SFP28, 8x 100G QSFP28, and 2x 10G SFP+ ports.',
    powerWatts: 420,
    weightKg: 8.8,
    airflow: 'Front-to-Back',
    color: '#171a22',
    frontImage: '/images/7220-ixr-d2.webp',
    accentColor: '#38bdf8',
    ports: buildD2LPorts(),
    rearModules: { psuCount: 2, fanTrayCount: 6 },
  },
  'IXR-D3': {
    id: 'IXR-D3',
    name: 'Nokia 7220 IXR-D3',
    series: '7220 IXR Line',
    heightU: 1,
    description: '1RU 400G High-Density Spine Switch with 32x 400G QSFP-DD ports.',
    powerWatts: 950,
    weightKg: 10.4,
    airflow: 'Front-to-Back',
    color: '#13161f',
    frontImage: '/images/7220-ixr-d3.webp',
    accentColor: '#a855f7',
    ports: buildD3LPorts(),
    rearModules: { psuCount: 2, fanTrayCount: 6 },
  },
  'IXR-D1': {
    id: 'IXR-D1',
    name: 'Nokia 7220 IXR-D1',
    series: '7220 IXR Line',
    heightU: 1,
    description: '1RU Access Switch with 48x 10G RJ45 Base-T and 4x 25G SFP28 uplinks.',
    powerWatts: 240,
    weightKg: 7.8,
    airflow: 'Front-to-Back',
    color: '#212530',
    frontImage: '/images/7220-ixr-d1.webp',
    accentColor: '#00e5a3',
    ports: buildD1Ports(),
    rearModules: { psuCount: 2, fanTrayCount: 4 },
  },
  'IXR-D5': {
    id: 'IXR-D5',
    name: 'Nokia 7220 IXR-D5',
    series: '7220 IXR Line',
    heightU: 1, // Set to 1 RU
    description: '1RU 800G Ultra-Density Core Switch featuring 32x 800G OSFP ports.',
    powerWatts: 1850,
    weightKg: 16.8,
    airflow: 'Front-to-Back',
    color: '#11141b',
    frontImage: '/images/7220-ixr-d5.webp',
    accentColor: '#f43f5e',
    ports: buildD5Ports(),
    rearModules: { psuCount: 3, fanTrayCount: 6 },
  },
  'SXR-1X-44S': {
    id: 'SXR-1X-44S',
    name: 'Nokia 7730 SXR-1X-44S',
    series: '7730 SXR Line',
    heightU: 1,
    description: '1RU Service Router featuring 44 High-Speed Optical Ports.',
    powerWatts: 620,
    weightKg: 9.4,
    airflow: 'Front-to-Back',
    color: '#151923',
    frontImage: '/images/7730-sxr-1x-44s.webp',
    accentColor: '#e11d48',
    ports: buildSXR1X44SPorts(),
    rearModules: { psuCount: 2, fanTrayCount: 5 },
  },
  'IXS-A1': {
    id: 'IXS-A1',
    name: 'Nokia 7215 IXS-A1',
    series: '7215 IXS Line',
    heightU: 1,
    description: '1RU Access Switch with 48x 10G Base-T and 4x 25G SFP28 uplinks.',
    powerWatts: 210,
    weightKg: 7.2,
    airflow: 'Front-to-Back',
    color: '#1e2430',
    frontImage: '/images/7215-ixs-a1.webp',
    accentColor: '#10b981',
    ports: buildA1Ports(),
    rearModules: { psuCount: 2, fanTrayCount: 4 },
  },
  'BLANK-1U': {
    id: 'BLANK-1U',
    name: 'Nokia 1U Vented Blanking Panel',
    series: 'Accessories',
    heightU: 1,
    description: '1RU Solid Anodized Aluminum airflow control panel.',
    powerWatts: 0,
    weightKg: 0.9,
    airflow: 'Passive',
    color: '#2a2e39',
    accentColor: '#64748b',
    ports: [],
    rearModules: null,
  },
  'CABLE-MGR-1U': {
    id: 'CABLE-MGR-1U',
    name: 'Nokia 1U Cable Management Duct',
    series: 'Accessories',
    heightU: 1,
    description: '1RU Horizontal cable management tray with 5 routing loops.',
    powerWatts: 0,
    weightKg: 1.2,
    airflow: 'Passive',
    color: '#1a1c23',
    accentColor: '#38bdf8',
    ports: [],
    rearModules: null,
  },
};

export const INITIAL_RACK_ITEMS = [
  {
    id: 'inst-d3l-1',
    modelId: 'IXR-D3L',
    startU: 38,
    customName: 'Spine-01 (Nokia 7220 IXR-D3L)',
    status: 'ACTIVE',
  },
  {
    id: 'inst-d2l-1',
    modelId: 'IXR-D2L',
    startU: 37,
    customName: 'Leaf-01 (Nokia 7220 IXR-D2L)',
    status: 'ACTIVE',
  },
  {
    id: 'inst-d2l-2',
    modelId: 'IXR-D2L',
    startU: 36,
    customName: 'Leaf-02 (Nokia 7220 IXR-D2L)',
    status: 'ACTIVE',
  },
  {
    id: 'inst-blank-1',
    modelId: 'BLANK-1U',
    startU: 35,
    customName: 'Vented Airflow Plate',
    status: 'PASSIVE',
  },
  {
    id: 'inst-d1-1',
    modelId: 'IXR-D1',
    startU: 34,
    customName: 'OOB-Mgmt-01 (Nokia 7220 IXR-D1)',
    status: 'ACTIVE',
  },
];
