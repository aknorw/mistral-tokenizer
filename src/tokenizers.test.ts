import { TokenizerVersion, getTokenizer } from '.'
import { TekkenTokenizerVersion } from './commons'

type BpeTestCase = {
  title: string
  encoded: Record<TokenizerVersion, ReadonlyArray<number>>
  decoded: string
}

const bpeTestCases: ReadonlyArray<BpeTestCase> = [
  {
    title: 'simple test case',
    encoded: {
      v1: [1, 13300],
      v2: [1, 14068],
      v3: [1, 14068],
    },
    decoded: 'grabbed',
  },
  {
    title: 'Naive implementation produces inconsistent tokenization for " grabbed", making this a good test case',
    encoded: {
      v1: [1, 28705, 13300],
      v2: [1, 29473, 14068],
      v3: [1, 29473, 14068],
    },
    decoded: ' grabbed',
  },
  {
    title:
      'Naive implementation uses incorrect merge order for multiple consecutive space merges, making this a good test case',
    encoded: {
      v1: [1, 17422, 13300],
      v2: [1, 18190, 14068],
      v3: [1, 18190, 14068],
    },
    decoded: '           grabbed',
  },
  {
    title: 'Linebreaks are handled as fallback to byte tokens',
    encoded: {
      v1: [1, 28705, 13],
      v2: [1, 29473, 781],
      v3: [1, 29473, 781],
    },
    decoded: '\n',
  },
  {
    title: 'Linebreaks (with BOS) are handled as fallback to byte tokens',
    encoded: {
      v1: [1, 259, 13],
      v2: [1, 1027, 781],
      v3: [1, 1027, 781],
    },
    decoded: ' \n',
  },
  {
    title: 'Tabs are handled as fallback to byte tokens',
    encoded: {
      v1: [1, 28705, 12, 24856, 12, 12, 12, 12, 406, 1236],
      v2: [1, 29473, 780, 25624, 780, 780, 780, 780, 1174, 2004],
      v3: [1, 29473, 780, 25624, 780, 780, 780, 780, 1174, 2004],
    },
    decoded: '	tabs				out here',
  },
  {
    title: 'Equal prio merges are performed left-to-right',
    encoded: {
      v1: [1, 6056, 13, 2000, 13, 1798, 28709],
      v2: [1, 6824, 781, 2768, 781, 2566, 29477],
      v3: [1, 6824, 781, 2768, 781, 2566, 29477],
    },
    decoded: 'ax\n####\nboo',
  },
  {
    title: 'UTF-8 multipoint character that should be found in vocabulary',
    encoded: {
      v1: [1, 28705, 29780],
      v2: [1, 29473, 30548],
      v3: [1, 29473, 30548],
    },
    decoded: '镇',
  },
  {
    title: 'UTF-8 multipoint character that should NOT be found in vocabulary, fallback to MULTIPLE byte tokens',
    encoded: {
      v1: [1, 28705, 243, 162, 169, 156],
      v2: [1, 29473, 1011, 930, 937, 924],
      v3: [1, 29473, 1011, 930, 937, 924],
    },
    decoded: '🦙',
  },
  {
    title:
      'Consecutive UTF-8 multipoint characters that are NOT found in a vocabulary and use DIFFERENT number of bytes',
    encoded: {
      v1: [1, 28705, 243, 162, 169, 156, 237, 156, 141],
      v2: [1, 29473, 1011, 930, 937, 924, 1005, 924, 909],
      v3: [1, 29473, 1011, 930, 937, 924, 1005, 924, 909],
    },
    decoded: '🦙Ꙋ',
  },
  {
    title:
      'Consecutive UTF-8 multipoint characters that are NOT found in a vocabulary and use DIFFERENT number of bytes',
    encoded: {
      v1: [1, 28705, 237, 156, 141, 243, 162, 169, 156],
      v2: [1, 29473, 1005, 924, 909, 1011, 930, 937, 924],
      v3: [1, 29473, 1005, 924, 909, 1011, 930, 937, 924],
    },
    decoded: 'Ꙋ🦙',
  },
  {
    title: 'Larger text input with various special characters sprinkled in',
    encoded: {
      v1: [
        1, 415, 8814, 2786, 325, 28748, 29097, 28714, 29813, 29240, 28719, 29108, 28748, 28745, 28705, 243, 162, 169,
        156, 13116, 789, 12704, 14281, 352, 28747, 733, 29097, 205, 145, 2786, 2803, 325, 28758, 2786, 1272, 2786,
        28731, 349, 264, 2853, 374, 6899, 3658, 2556, 3730, 301, 313, 28725, 12575, 1307, 390, 264, 10228, 304, 2163,
        8527, 486, 1015, 28706, 276, 19826, 1854, 272, 4258, 28733, 1577, 2915, 753, 4204, 28723, 393, 5989, 293, 460,
        2809, 8222, 304, 2943, 395, 2663, 390, 264, 559, 28715, 28723, 6723, 25943, 349, 2664, 304, 5876, 865, 264,
        1741, 3558, 302, 26573, 27545, 20011, 28750, 28793, 393, 5989, 293, 541, 2822, 3588, 9796, 1024, 264, 1664,
        21435, 2065, 28723, 1684, 1413, 264, 2163, 28725, 590, 541, 7096, 684, 28705, 28750, 28782, 298, 28705, 28770,
        28734, 28823, 302, 652, 2187, 4336, 354, 28705, 28783, 298, 28705, 28740, 28770, 3535, 325, 28782, 28816, 28783,
        6052, 609, 28792, 28770, 28793, 415, 1141, 8814, 2786, 325, 262, 272, 2609, 835, 668, 6099, 345, 28714, 2786,
        28739, 442, 345, 1727, 2786, 1243, 403, 13424, 486, 6392, 4641, 8531, 477, 8271, 2744, 5388, 3693, 20011, 28781,
        28793, 415, 25427, 302, 17620, 293, 460, 1654, 298, 506, 5016, 601, 477, 272, 6043, 1641, 1606, 302, 3964, 4352,
        684, 28705, 28781, 28734, 3841, 1267, 3584, 28725, 304, 18410, 11205, 601, 298, 3658, 4352, 684, 1712, 3841,
        1267, 3584, 1938, 272, 6043, 2556, 4287, 4078, 28723, 2463, 272, 948, 302, 272, 1432, 7515, 3595, 325, 28740,
        28734, 28725, 28734, 28734, 28734, 28816, 28740, 28750, 28725, 28734, 28734, 28734, 1267, 3584, 557, 3730, 301,
        2298, 654, 1568, 5654, 297, 3964, 4352, 20011, 28770, 28793, 1136, 302, 28705, 28750, 28734, 28734, 28787,
        28725, 736, 654, 754, 6671, 3841, 17620, 293, 304, 389, 28720, 323, 293, 297, 3658, 4352, 304, 754, 28705,
        28740, 28782, 28783, 28725, 28734, 28734, 28734, 17620, 293, 304, 28705, 28740, 28734, 28734, 28725, 28734,
        28734, 28734, 237, 156, 141, 243, 162, 169, 156, 389, 28720, 323, 293, 28725, 2283, 2508, 477, 430, 2383, 9058,
        26659, 3909, 297, 272, 28705, 28750, 28734, 362, 5445, 28725, 297, 272, 2969, 3543, 304, 6082, 20011, 28782,
        28793, 560, 330, 1082, 2923, 13345, 2161, 28725, 17620, 293, 460, 2278, 16905, 28723, 415, 22830, 346, 393,
        28714, 2786, 349, 773, 298, 4663, 2130, 477, 272, 13993, 304, 4273, 10218, 390, 378, 408, 1606, 20011, 28784,
        28793, 6586, 298, 330, 1082, 2923, 1037, 12932, 2161, 28725, 17620, 293, 622, 604, 298, 272, 2130, 7474, 28713,
        304, 305, 4567, 1053, 970, 590, 1567, 477, 438, 272, 948, 302, 727, 20011, 28784, 28793,
      ],
      v2: [
        1, 1183, 9582, 3554, 1093, 29516, 29865, 29482, 30581, 30008, 29487, 29876, 29516, 29513, 29473, 1011, 930, 937,
        924, 13884, 1557, 13472, 15049, 1120, 29515, 1501, 29865, 973, 913, 3554, 3571, 1093, 29526, 3554, 2040, 3554,
        29499, 1117, 1032, 3621, 1142, 7667, 4426, 3324, 4498, 1069, 1081, 29493, 13343, 2075, 1158, 1032, 10996, 1072,
        2931, 9295, 1254, 1783, 29474, 1044, 20594, 2622, 1040, 5026, 29501, 2345, 3683, 1521, 4972, 29491, 1161, 6757,
        1061, 1228, 3577, 8990, 1072, 3711, 1163, 3431, 1158, 1032, 1327, 29483, 29491, 7491, 26711, 1117, 3432, 1072,
        6644, 1633, 1032, 2509, 4326, 1070, 27341, 28313, 20779, 29518, 29561, 1161, 6757, 1061, 1309, 3590, 4356,
        10564, 1792, 1032, 2432, 22203, 2833, 29491, 2452, 2181, 1032, 2931, 29493, 1358, 1309, 7864, 1452, 29473,
        29518, 29550, 1066, 29473, 29538, 29502, 29591, 1070, 1420, 2955, 5104, 1122, 29473, 29551, 1066, 29473, 29508,
        29538, 4303, 1093, 29550, 29584, 29551, 6820, 1377, 29560, 29538, 29561, 1183, 1909, 9582, 3554, 1093, 1030,
        1040, 3377, 1603, 1436, 6867, 1113, 29482, 3554, 29507, 1210, 1113, 2495, 3554, 2011, 1171, 14192, 1254, 7160,
        5409, 9299, 1245, 9039, 3512, 6156, 4461, 20779, 29549, 29561, 1183, 26195, 1070, 18388, 1061, 1228, 2422, 1066,
        1274, 5784, 1369, 1245, 1040, 6811, 2409, 2374, 1070, 4732, 5120, 1452, 29473, 29549, 29502, 4609, 2035, 4352,
        29493, 1072, 19178, 11973, 1369, 1066, 4426, 5120, 1452, 2480, 4609, 2035, 4352, 2706, 1040, 6811, 3324, 5055,
        4846, 29491, 3231, 1040, 1716, 1070, 1040, 2200, 8283, 4363, 1093, 29508, 29502, 29493, 29502, 29502, 29502,
        29584, 29508, 29518, 29493, 29502, 29502, 29502, 2035, 4352, 1325, 4498, 1069, 3066, 1422, 2336, 6422, 1065,
        4732, 5120, 20779, 29538, 29561, 1904, 1070, 29473, 29518, 29502, 29502, 29555, 29493, 1504, 1422, 1522, 7439,
        4609, 18388, 1061, 1072, 1157, 29488, 1091, 1061, 1065, 4426, 5120, 1072, 1522, 29473, 29508, 29550, 29551,
        29493, 29502, 29502, 29502, 18388, 1061, 1072, 29473, 29508, 29502, 29502, 29493, 29502, 29502, 29502, 1005,
        924, 909, 1011, 930, 937, 924, 1157, 29488, 1091, 1061, 29493, 3051, 3276, 1245, 1198, 3151, 9826, 27427, 4677,
        1065, 1040, 29473, 29518, 29502, 1130, 6213, 29493, 1065, 1040, 3737, 4311, 1072, 6850, 20779, 29550, 29561,
        1328, 1098, 1850, 3691, 14113, 2929, 29493, 18388, 1061, 1228, 3046, 17673, 29491, 1183, 23598, 1114, 1161,
        29482, 3554, 1117, 1541, 1066, 5431, 2898, 1245, 1040, 14761, 1072, 5041, 10986, 1158, 1146, 1176, 2374, 20779,
        29552, 29561, 7354, 1066, 1098, 1850, 3691, 1805, 13700, 2929, 29493, 18388, 1061, 1390, 1372, 1066, 1040, 2898,
        8242, 29481, 1072, 1073, 5335, 1821, 1738, 1358, 2335, 1245, 1206, 1040, 1716, 1070, 1495, 20779, 29552, 29561,
      ],
      v3: [
        1, 1183, 9582, 3554, 1093, 29516, 29865, 29482, 30581, 30008, 29487, 29876, 29516, 29513, 29473, 1011, 930, 937,
        924, 13884, 1557, 13472, 15049, 1120, 29515, 1501, 29865, 973, 913, 3554, 3571, 1093, 29526, 3554, 2040, 3554,
        29499, 1117, 1032, 3621, 1142, 7667, 4426, 3324, 4498, 1069, 1081, 29493, 13343, 2075, 1158, 1032, 10996, 1072,
        2931, 9295, 1254, 1783, 29474, 1044, 20594, 2622, 1040, 5026, 29501, 2345, 3683, 1521, 4972, 29491, 1161, 6757,
        1061, 1228, 3577, 8990, 1072, 3711, 1163, 3431, 1158, 1032, 1327, 29483, 29491, 7491, 26711, 1117, 3432, 1072,
        6644, 1633, 1032, 2509, 4326, 1070, 27341, 28313, 20779, 29518, 29561, 1161, 6757, 1061, 1309, 3590, 4356,
        10564, 1792, 1032, 2432, 22203, 2833, 29491, 2452, 2181, 1032, 2931, 29493, 1358, 1309, 7864, 1452, 29473,
        29518, 29550, 1066, 29473, 29538, 29502, 29591, 1070, 1420, 2955, 5104, 1122, 29473, 29551, 1066, 29473, 29508,
        29538, 4303, 1093, 29550, 29584, 29551, 6820, 1377, 29560, 29538, 29561, 1183, 1909, 9582, 3554, 1093, 1030,
        1040, 3377, 1603, 1436, 6867, 1113, 29482, 3554, 29507, 1210, 1113, 2495, 3554, 2011, 1171, 14192, 1254, 7160,
        5409, 9299, 1245, 9039, 3512, 6156, 4461, 20779, 29549, 29561, 1183, 26195, 1070, 18388, 1061, 1228, 2422, 1066,
        1274, 5784, 1369, 1245, 1040, 6811, 2409, 2374, 1070, 4732, 5120, 1452, 29473, 29549, 29502, 4609, 2035, 4352,
        29493, 1072, 19178, 11973, 1369, 1066, 4426, 5120, 1452, 2480, 4609, 2035, 4352, 2706, 1040, 6811, 3324, 5055,
        4846, 29491, 3231, 1040, 1716, 1070, 1040, 2200, 8283, 4363, 1093, 29508, 29502, 29493, 29502, 29502, 29502,
        29584, 29508, 29518, 29493, 29502, 29502, 29502, 2035, 4352, 1325, 4498, 1069, 3066, 1422, 2336, 6422, 1065,
        4732, 5120, 20779, 29538, 29561, 1904, 1070, 29473, 29518, 29502, 29502, 29555, 29493, 1504, 1422, 1522, 7439,
        4609, 18388, 1061, 1072, 1157, 29488, 1091, 1061, 1065, 4426, 5120, 1072, 1522, 29473, 29508, 29550, 29551,
        29493, 29502, 29502, 29502, 18388, 1061, 1072, 29473, 29508, 29502, 29502, 29493, 29502, 29502, 29502, 1005,
        924, 909, 1011, 930, 937, 924, 1157, 29488, 1091, 1061, 29493, 3051, 3276, 1245, 1198, 3151, 9826, 27427, 4677,
        1065, 1040, 29473, 29518, 29502, 1130, 6213, 29493, 1065, 1040, 3737, 4311, 1072, 6850, 20779, 29550, 29561,
        1328, 1098, 1850, 3691, 14113, 2929, 29493, 18388, 1061, 1228, 3046, 17673, 29491, 1183, 23598, 1114, 1161,
        29482, 3554, 1117, 1541, 1066, 5431, 2898, 1245, 1040, 14761, 1072, 5041, 10986, 1158, 1146, 1176, 2374, 20779,
        29552, 29561, 7354, 1066, 1098, 1850, 3691, 1805, 13700, 2929, 29493, 18388, 1061, 1390, 1372, 1066, 1040, 2898,
        8242, 29481, 1072, 1073, 5335, 1821, 1738, 1358, 2335, 1245, 1206, 1040, 1716, 1070, 1495, 20779, 29552, 29561,
      ],
    },
    decoded:
      'The llama (/ˈlɑːmə/; 🦙Spanish pronunciation: [ˈʎama]) (Lama glama) is a domesticated South American camelid, widely used as a meat and pack animal by Andean cultures since the Pre-Columbian era. Llamas are social animals and live with others as a herd. Their wool is soft and contains only a small amount of lanolin.[2] Llamas can learn simple tasks after a few repetitions. When using a pack, they can carry about 25 to 30% of their body weight for 8 to 13 km (5–8 miles).[3] The name llama (in the past also spelled "lama" or "glama") was adopted by European settlers from native Peruvians.[4] The ancestors of llamas are thought to have originated from the Great Plains of North America about 40 million years ago, and subsequently migrated to South America about three million years ago during the Great American Interchange. By the end of the last ice age (10,000–12,000 years ago), camelids were extinct in North America.[3] As of 2007, there were over seven million llamas and alpacas in South America and over 158,000 llamas and 100,000Ꙋ🦙 alpacas, descended from progenitors imported late in the 20th century, in the United States and Canada.[5] In Aymara mythology, llamas are important beings. The Heavenly Llama is said to drink water from the ocean and urinates as it rains.[6] According to Aymara eschatology, llamas will return to the water springs and lagoons where they come from at the end of time.[6]',
  },
]

describe('MistralTokenizer - BPE', () => {
  for (const version of Object.values(TokenizerVersion)) {
    describe(version, () => {
      const tokenizer = getTokenizer(version, false, false)

      describe('encode', () => {
        bpeTestCases.forEach((testCase) => {
          test(testCase.title, () => {
            const tokenIds = tokenizer.encode(testCase.decoded)
            expect(tokenIds).toEqual(testCase.encoded[version])
          })
        })
      })

      describe('decode', () => {
        bpeTestCases.forEach((testCase) => {
          test(testCase.title, () => {
            const decoded = tokenizer.decode(testCase.encoded[version])
            expect(decoded).toEqual(testCase.decoded)
          })
        })
      })
    })
  }
})

type TekkenTestCase = {
  title: string
  encoded: Record<TekkenTokenizerVersion, ReadonlyArray<number>>
  decoded: string
}

const tekkenTestCases: ReadonlyArray<TekkenTestCase> = [
  {
    title: 'simple test case',
    encoded: {
      v3: [1, 1103, 5988, 3507], // returns 132857, 3507
    },
    decoded: 'grabbed',
  },
  {
    title: 'Naive implementation produces inconsistent tokenization for " grabbed", making this a good test case',
    encoded: {
      v3: [1, 29002],
    },
    decoded: ' grabbed',
  },
  {
    title:
      'Naive implementation uses incorrect merge order for multiple consecutive space merges, making this a good test case',
    encoded: {
      v3: [1, 6367, 29002],
    },
    decoded: '           grabbed',
  },
  {
    title: 'Linebreaks are handled as fallback to byte tokens',
    encoded: {
      v3: [1, 1010],
    },
    decoded: '\n',
  },
  {
    title: 'Linebreaks (with BOS) are handled as fallback to byte tokens',
    encoded: {
      v3: [1, 1032, 1010],
    },
    decoded: ' \n',
  },
  {
    title: 'Tabs are handled as fallback to byte tokens',
    encoded: {
      v3: [1, 14133, 8217, 2536, 60024, 3226],
    },
    decoded: '	tabs				out here',
  },
  {
    title: 'Equal prio merges are performed left-to-right',
    encoded: {
      v3: [1, 2753, 1010, 2293, 1010, 2363, 1111],
    },
    decoded: 'ax\n####\nboo',
  },
  {
    title: 'UTF-8 multipoint character that should be found in vocabulary',
    encoded: {
      v3: [1, 10716, 1135],
    },
    decoded: '镇',
  },
  {
    title: 'UTF-8 multipoint character that should NOT be found in vocabulary, fallback to MULTIPLE byte tokens',
    encoded: {
      v3: [1, 1240, 1159, 1166, 1153],
    },
    decoded: '🦙',
  },
  {
    title:
      'Consecutive UTF-8 multipoint characters that are NOT found in a vocabulary and use DIFFERENT number of bytes',
    encoded: {
      v3: [1, 1240, 1159, 1166, 1153, 1234, 1153, 1138],
    },
    decoded: '🦙Ꙋ',
  },
  {
    title:
      'Consecutive UTF-8 multipoint characters that are NOT found in a vocabulary and use DIFFERENT number of bytes',
    encoded: {
      v3: [1, 1234, 1153, 1138, 1240, 1159, 1166, 1153],
    },
    decoded: 'Ꙋ🦙',
  },
  {
    title: 'Larger text input with various special characters sprinkled in',
    encoded: {
      v3: [
        1, 1784, 59643, 72931, 1203, 1136, 1108, 1201, 1145, 84107, 69683, 1047, 1059, 119685, 1166, 1153, 115073,
        96752, 1058, 1766, 1203, 1136, 1202, 1142, 3490, 8623, 1319, 1076, 3490, 3008, 3490, 1041, 1395, 1261, 42479,
        12500, 6443, 5150, 98537, 1327, 1044, 14769, 2434, 1435, 1261, 25835, 1321, 7558, 11386, 1536, 3060, 45372,
        19192, 4136, 1278, 6438, 51911, 5430, 1911, 4033, 1046, 1424, 5722, 1288, 1584, 4346, 11115, 1321, 7971, 1454,
        6218, 1435, 1261, 73755, 1046, 14865, 74931, 1395, 6444, 1321, 8688, 2342, 1261, 3709, 5647, 1307, 12103, 29023,
        8925, 1050, 1093, 1424, 5722, 1288, 1710, 8178, 6165, 15048, 2453, 1261, 4517, 124440, 1046, 4925, 2505, 1261,
        7558, 1044, 2127, 1710, 10739, 2314, 1032, 1050, 1053, 1317, 1032, 1051, 1048, 1037, 1307, 2034, 4212, 5954,
        1394, 1032, 1056, 1317, 1032, 1049, 1051, 4661, 1319, 1053, 1882, 1056, 14079, 93719, 1051, 1093, 1531, 2564,
        59643, 1319, 1259, 1278, 6334, 2095, 113621, 1429, 82866, 1034, 1505, 1429, 3779, 3490, 4428, 1486, 18230, 1536,
        9298, 60553, 1562, 15191, 36318, 2719, 1545, 8925, 1052, 1093, 1531, 61015, 1307, 12949, 1288, 1584, 4914, 1317,
        1736, 48163, 1562, 1278, 11560, 92184, 1307, 7018, 9386, 2314, 1032, 1052, 1048, 7067, 3351, 11759, 1044, 1321,
        17732, 81951, 1317, 6443, 9386, 2314, 3300, 7067, 3351, 11759, 3184, 1278, 11560, 5150, 6323, 6484, 1046, 5652,
        1278, 2362, 1307, 1278, 3804, 16254, 5128, 1319, 1049, 1048, 1044, 1048, 1048, 1048, 1882, 1049, 1050, 1044,
        1048, 1048, 1048, 3351, 11759, 1574, 98537, 4807, 1722, 92810, 1294, 7018, 9386, 8925, 1051, 1093, 2813, 1307,
        1032, 1050, 1048, 1048, 1055, 1044, 2156, 1722, 2136, 11282, 7067, 12949, 1288, 1321, 86080, 52280, 1294, 6443,
        9386, 1321, 2136, 1032, 1049, 1053, 1056, 1044, 1048, 1048, 1048, 12949, 1288, 1321, 1032, 1049, 1048, 1048,
        1044, 1048, 1048, 1048, 1234, 1153, 1138, 1240, 1159, 1166, 1153, 86080, 52280, 1044, 71469, 1562, 119171,
        39457, 7276, 1294, 1278, 1032, 1050, 1048, 1411, 8042, 1044, 1294, 1278, 4857, 6086, 1321, 9591, 8925, 1053,
        1093, 1656, 1349, 2360, 2912, 93703, 1044, 12949, 1288, 1584, 4023, 35478, 1046, 1531, 42741, 1405, 48912, 3490,
        1395, 2639, 1317, 12815, 4180, 1562, 1278, 27208, 1321, 3642, 1259, 2130, 1435, 1494, 120231, 8925, 1054, 1093,
        10228, 1317, 1349, 2360, 2912, 1823, 11274, 3678, 1044, 12949, 1288, 2084, 1850, 1317, 1278, 4180, 64177, 1321,
        47182, 2232, 2478, 2127, 3930, 1562, 1513, 1278, 2362, 1307, 2142, 8925, 1054, 1093,
      ],
    },
    decoded:
      'The llama (/ˈlɑːmə/; 🦙Spanish pronunciation: [ˈʎama]) (Lama glama) is a domesticated South American camelid, widely used as a meat and pack animal by Andean cultures since the Pre-Columbian era. Llamas are social animals and live with others as a herd. Their wool is soft and contains only a small amount of lanolin.[2] Llamas can learn simple tasks after a few repetitions. When using a pack, they can carry about 25 to 30% of their body weight for 8 to 13 km (5–8 miles).[3] The name llama (in the past also spelled "lama" or "glama") was adopted by European settlers from native Peruvians.[4] The ancestors of llamas are thought to have originated from the Great Plains of North America about 40 million years ago, and subsequently migrated to South America about three million years ago during the Great American Interchange. By the end of the last ice age (10,000–12,000 years ago), camelids were extinct in North America.[3] As of 2007, there were over seven million llamas and alpacas in South America and over 158,000 llamas and 100,000Ꙋ🦙 alpacas, descended from progenitors imported late in the 20th century, in the United States and Canada.[5] In Aymara mythology, llamas are important beings. The Heavenly Llama is said to drink water from the ocean and urinates as it rains.[6] According to Aymara eschatology, llamas will return to the water springs and lagoons where they come from at the end of time.[6]',
  },
]

describe('MistralTokenizer - Tekken', () => {
  for (const version of Object.values(TekkenTokenizerVersion)) {
    for (const isMultimodal of [false, true]) {
      describe(`${version} - isMultimodal: ${isMultimodal}`, () => {
        const tokenizer = getTokenizer(version, true, isMultimodal)

        describe('encode', () => {
          tekkenTestCases.forEach((testCase) => {
            test(testCase.title, () => {
              const tokenIds = tokenizer.encode(testCase.decoded)
              expect(tokenIds).toEqual(testCase.encoded[version])
            })
          })
        })

        describe('decode', () => {
          tekkenTestCases.forEach((testCase) => {
            test(testCase.title, () => {
              const decoded = tokenizer.decode(testCase.encoded[version])
              expect(decoded).toEqual(testCase.decoded)
            })
          })
        })
      })
    }
  }
})
