#!/usr/bin/env node

/**
 * ClipPilot 테스트 사용자 생성 스크립트
 *
 * 사용법:
 *   node scripts/create-test-users.js
 *
 * 환경 변수 필요:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (Service Role Key - Dashboard에서 확인)
 */

const { createClient } = require('@supabase/supabase-js');

// 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n💡 .env.local 파일에 추가해주세요.');
  process.exit(1);
}

// Service Role Key로 Supabase Admin 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_USERS = [
  {
    email: 'admin@clippilot.test',
    password: 'Admin1234!@',
    metadata: {
      onboarding_completed: true,
      is_admin: true
    },
    description: '관리자 계정'
  },
  {
    email: 'test@clippilot.test',
    password: 'Test1234!@',
    metadata: {
      onboarding_completed: false,
      is_admin: false
    },
    description: '일반 테스트 계정'
  },
  {
    email: 'jackslash@naver.com',
    password: 'Rlawjdtlr1234!@',
    metadata: {
      onboarding_completed: false,
      is_admin: false
    },
    description: '개발자 테스트 계정'
  }
];

async function createTestUsers() {
  console.log('🚀 ClipPilot 테스트 사용자 생성 시작...\n');

  for (const user of TEST_USERS) {
    console.log(`📧 ${user.description} 생성 중...`);
    console.log(`   이메일: ${user.email}`);
    console.log(`   비밀번호: ${user.password}`);

    try {
      // Service Role Key를 사용하면 이메일 확인 없이 사용자 생성 가능
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // 이메일 자동 확인
        user_metadata: user.metadata
      });

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`   ⚠️  이미 존재하는 계정입니다.\n`);
        } else {
          console.error(`   ❌ 생성 실패: ${error.message}\n`);
        }
      } else {
        console.log(`   ✅ 생성 완료! (ID: ${data.user.id})\n`);
      }
    } catch (err) {
      console.error(`   ❌ 오류 발생: ${err.message}\n`);
    }
  }

  console.log('✨ 테스트 사용자 생성 완료!\n');
  console.log('📝 로그인 가능한 계정:');
  TEST_USERS.forEach(user => {
    console.log(`   - ${user.email} / ${user.password}`);
  });
}

// 스크립트 실행
createTestUsers()
  .then(() => {
    console.log('\n✅ 완료!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ 오류:', err);
    process.exit(1);
  });
