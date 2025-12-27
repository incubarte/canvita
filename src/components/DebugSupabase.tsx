import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const DebugSupabase = () => {
  const [output, setOutput] = useState<string[]>([]);

  const log = (msg: string) => {
    console.log(msg);
    setOutput(prev => [...prev, msg]);
  };

  const testQuery = async () => {
    setOutput([]);
    log('🧪 Testing query to users table...');

    try {
      const startTime = Date.now();
      log('⏱️ Starting query at ' + new Date().toISOString());

      const { data, error } = await supabase
        .from('users')
        .select('id, email, role')
        .limit(5);

      const elapsed = Date.now() - startTime;
      log(`✅ Query completed in ${elapsed}ms`);

      if (error) {
        log('❌ ERROR: ' + JSON.stringify(error, null, 2));
      } else {
        log(`✅ SUCCESS: ${data?.length || 0} users found`);
        log('Data: ' + JSON.stringify(data, null, 2));
      }
    } catch (e: any) {
      log('💥 EXCEPTION: ' + e.message);
    }
  };

  const testAuth = async () => {
    setOutput([]);
    const email = prompt('Email:');
    const password = prompt('Password:');

    if (!email || !password) return;

    log('🔐 Testing auth with ' + email + '...');

    try {
      const startTime = Date.now();

      log('⏱️ Calling signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      const elapsed = Date.now() - startTime;
      log(`✅ Auth completed in ${elapsed}ms`);

      if (error) {
        log('❌ AUTH ERROR: ' + error.message);
      } else {
        log('✅ AUTH SUCCESS for user: ' + data.user?.id);

        // Now try to fetch from users table
        log('📊 Fetching user data from users table...');
        const queryStart = Date.now();

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user!.id)
          .single();

        const queryElapsed = Date.now() - queryStart;
        log(`✅ User query completed in ${queryElapsed}ms`);

        if (userError) {
          log('❌ USER DATA ERROR: ' + JSON.stringify(userError, null, 2));
        } else {
          log('✅ USER DATA SUCCESS');
          log('Role: ' + userData?.role);
          log('Name: ' + userData?.name);
        }
      }
    } catch (e: any) {
      log('💥 EXCEPTION: ' + e.message);
    }
  };

  const testConnection = async () => {
    setOutput([]);
    log('🔌 Testing Supabase connection...');

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        log('❌ ERROR: ' + error.message);
      } else {
        log('✅ SUCCESS: Connection OK');
        if (data.session) {
          log('📝 Active session for: ' + data.session.user.email);
        } else {
          log('📝 No active session');
        }
      }
    } catch (e: any) {
      log('💥 EXCEPTION: ' + e.message);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/90 z-50 overflow-auto p-8">
      <div className="max-w-4xl mx-auto bg-gray-900 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-4">Supabase Debug Panel</h1>

        <div className="flex gap-2 mb-4">
          <button
            onClick={testConnection}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Test Connection
          </button>
          <button
            onClick={testQuery}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Test Query
          </button>
          <button
            onClick={testAuth}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Test Auth
          </button>
          <button
            onClick={() => setOutput([])}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear
          </button>
        </div>

        <div className="bg-black rounded p-4 font-mono text-sm">
          {output.length === 0 ? (
            <div className="text-gray-500">Click a button to test...</div>
          ) : (
            output.map((line, i) => (
              <div key={i} className="text-green-400">{line}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
