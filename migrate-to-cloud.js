#!/usr/bin/env node

/**
 * 로컬 MongoDB에서 클라우드 MongoDB로 데이터 마이그레이션
 * 사용법: node migrate-to-cloud.js
 */

const { exec } = require('child_process');
const path = require('path');

// 환경 변수에서 클라우드 MongoDB URI 가져오기
require('dotenv').config();

const CLOUD_MONGODB_URI = process.env.MONGODB_URI;
const BACKUP_PATH = path.join(__dirname, 'backend/backup/admore');

if (!CLOUD_MONGODB_URI) {
  console.error('❌ MONGODB_URI 환경 변수가 설정되지 않았습니다.');
  console.log('📝 .env 파일에 MONGODB_URI를 설정해주세요.');
  process.exit(1);
}

console.log('🚀 MongoDB 클라우드 마이그레이션 시작...');
console.log('📁 백업 경로:', BACKUP_PATH);
console.log('☁️  클라우드 URI:', CLOUD_MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

// mongorestore 명령어 실행
const restoreCommand = `mongorestore --uri "${CLOUD_MONGODB_URI}" --drop ${BACKUP_PATH}`;

console.log('\n📤 데이터 복원 중...');
console.log('명령어:', restoreCommand.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

exec(restoreCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ 마이그레이션 실패:', error.message);
    process.exit(1);
  }
  
  if (stderr) {
    console.log('⚠️  경고:', stderr);
  }
  
  console.log('✅ 마이그레이션 완료!');
  console.log('📊 복원된 데이터:', stdout);
  
  // 연결 테스트
  console.log('\n🔍 연결 테스트 중...');
  const testCommand = `mongosh "${CLOUD_MONGODB_URI}" --eval "db.runCommand('ping')"`;
  
  exec(testCommand, (testError, testStdout, testStderr) => {
    if (testError) {
      console.error('❌ 연결 테스트 실패:', testError.message);
      return;
    }
    
    console.log('✅ 클라우드 MongoDB 연결 성공!');
    console.log('📝 이제 백엔드 서버를 재시작하여 클라우드 MongoDB를 사용할 수 있습니다.');
  });
});
