// Stage 4 DEV3-007 (2026-04-15): rootDir + testPathIgnorePatterns 정정
//
// 이전 상태:
// - rootDir: 'src' → src/ 외부의 test/app.e2e-spec.ts 수집 안 됨
// - .bak / .legacy-old-system 명시적 exclude 없음 (현재는 우연히 .ts 확장자 불일치로 제외 중이지만
//   미래의 rename 실수 시 자동 포함 위험)
//
// 신 상태:
// - rootDir: '.' → src/ + test/ 양쪽 수집
// - testPathIgnorePatterns 명시: node_modules, dist, .bak, .legacy-old-system, .legacy
// - testRegex 유지: .spec.ts 만 매치
//
// 후속 (DEV3-006 supertest devDep 추가 완료 후 가능):
// - test/app.e2e-spec.ts가 supertest를 이제 정상 import 가능
// - pnpm test 실행 시 e2e도 함께 수집됨

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testRegex: '.*\\.spec\\.ts$',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '\\.bak$',
    '\\.legacy-old-system$',
    '\\.legacy$',
  ],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};
