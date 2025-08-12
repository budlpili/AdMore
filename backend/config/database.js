// 임시 SQLite 데이터베이스 설정 (에러 방지용)
// 실제로는 MongoDB를 사용합니다

const mockDb = {
  get: (sql, params, callback) => {
    console.log('SQLite 호출됨 (MongoDB로 전환 필요):', sql);
    callback(null, null);
  },
  all: (sql, params, callback) => {
    console.log('SQLite 호출됨 (MongoDB로 전환 필요):', sql);
    callback(null, []);
  },
  run: (sql, params, callback) => {
    console.log('SQLite 호출됨 (MongoDB로 전환 필요):', sql);
    if (callback) callback(null);
  }
};

module.exports = mockDb;
