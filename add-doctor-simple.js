// Simple script to add Dr. Poonam Jain using console
console.log('To add Dr. Poonam Jain, run these commands in the browser console:');
console.log('');
console.log('// First, import supabase');
console.log('// Go to Settings modal, open browser console, and run:');
console.log('');
console.log('// 1. Add PHYSIOTHERAPY department');
console.log(`
const addDept = async () => {
  const { data, error } = await window.supabase
    .from('departments')
    .upsert([{
      name: 'PHYSIOTHERAPY',
      description: 'Physiotherapy and Rehabilitation',
      is_active: true
    }], { onConflict: 'name' })
    .select();
  console.log('Department result:', { data, error });
};
addDept();
`);

console.log('// 2. Add Dr. Poonam Jain');
console.log(`
const addDoctor = async () => {
  const { data, error } = await window.supabase
    .from('doctors')
    .upsert([{
      name: 'DR. POONAM JAIN',
      department: 'PHYSIOTHERAPY',
      specialization: 'Physiotherapist',
      fee: 600.00,
      is_active: true
    }], { onConflict: 'name' })
    .select();
  console.log('Doctor result:', { data, error });
};
addDoctor();
`);

console.log('// 3. Verify additions');
console.log(`
const verify = async () => {
  const { data: depts } = await window.supabase.from('departments').select('*').eq('name', 'PHYSIOTHERAPY');
  const { data: docs } = await window.supabase.from('doctors').select('*').eq('name', 'DR. POONAM JAIN');
  console.log('Department found:', depts);
  console.log('Doctor found:', docs);
};
verify();
`);