const { spawn } = require('child_process');
const pythonPath = "C:\\Users\\Lucky\\OneDrive\\Desktop\\AI\\blog_web_app\\backend\\conda\\envs\\blogGenration\\python.exe";

console.log('Spawning:', pythonPath);
const py = spawn(pythonPath, ['--version']);

py.stdout.on('data', (data) => {
  console.log('STDOUT:', data.toString());
});

py.stderr.on('data', (data) => {
  console.log('STDERR:', data.toString());
});

py.on('error', (err) => {
  console.error('ERROR:', err);
});

py.on('close', (code) => {
  console.log('Exited with:', code);
});
