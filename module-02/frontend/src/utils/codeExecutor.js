let pyodideInstance = null;
let isPyodideReady = false;

/**
 * Initialize Pyodide - called once when needed
 */
export async function initializePyodide() {
  if (isPyodideReady && pyodideInstance) {
    return pyodideInstance;
  }

  try {
    // Load Pyodide from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.0/full/pyodide.js';
    document.head.appendChild(script);

    // Wait for Pyodide to be available
    await new Promise((resolve, reject) => {
      script.onload = () => {
        setTimeout(() => {
          if (window.loadPyodide) {
            resolve();
          } else {
            reject(new Error('Pyodide failed to load'));
          }
        }, 100);
      };
      script.onerror = () => reject(new Error('Failed to load Pyodide script'));
    });

    pyodideInstance = await window.loadPyodide();
    isPyodideReady = true;
    return pyodideInstance;
  } catch (error) {
    console.error('Failed to initialize Pyodide:', error);
    throw new Error('Failed to initialize Python runtime: ' + error.message);
  }
}

/**
 * Execute JavaScript code in browser
 */
function executeJavaScript(code) {
  const output = [];
  const logs = [];
  const errors = [];

  const customConsole = {
    log: (...args) => {
      const message = args.map(arg => String(arg)).join(' ');
      logs.push(message);
      output.push({ type: 'success', message });
    },
    error: (...args) => {
      const message = args.map(arg => String(arg)).join(' ');
      errors.push(message);
      output.push({ type: 'error', message });
    },
    warn: (...args) => {
      const message = '⚠️ ' + args.map(arg => String(arg)).join(' ');
      logs.push(message);
      output.push({ type: 'success', message });
    },
    info: (...args) => {
      const message = 'ℹ️ ' + args.map(arg => String(arg)).join(' ');
      logs.push(message);
      output.push({ type: 'success', message });
    }
  };

  try {
    const func = new Function('console', code);
    func(customConsole);

    if (logs.length === 0 && errors.length === 0) {
      output.push({ type: 'info', message: 'Code executed successfully (no output)' });
    }
  } catch (error) {
    output.push({ type: 'error', message: `Runtime Error: ${error.message}` });
  }

  return output;
}

/**
 * Execute Python code using Pyodide (WASM)
 */
async function executePython(code) {
  const output = [];

  try {
    // Initialize Pyodide if not already done
    const pyodide = await initializePyodide();

    // Capture stdout/stderr
    pyodide.runPython(`
import sys
from io import StringIO

_stdout = StringIO()
_stderr = StringIO()
sys.stdout = _stdout
sys.stderr = _stderr
`);

    try {
      // Execute user code
      pyodide.runPython(code);

      // Get captured output
      const stdout = pyodide.runPython('_stdout.getvalue()');
      const stderr = pyodide.runPython('_stderr.getvalue()');

      // Reset stdout/stderr
      pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);

      // Add stdout output
      if (stdout.trim()) {
        stdout.split('\n').forEach(line => {
          if (line.trim()) {
            output.push({ type: 'success', message: line });
          }
        });
      }

      // Add stderr output
      if (stderr.trim()) {
        stderr.split('\n').forEach(line => {
          if (line.trim()) {
            output.push({ type: 'error', message: line });
          }
        });
      }

      if (!stdout.trim() && !stderr.trim()) {
        output.push({ type: 'info', message: 'Code executed successfully (no output)' });
      }
    } catch (error) {
      output.push({ type: 'error', message: `Python Runtime Error: ${error.message}` });
    }
  } catch (error) {
    output.push({ type: 'error', message: `Failed to execute Python: ${error.message}` });
  }

  return output;
}

/**
 * Execute TypeScript code as JavaScript
 */
function executeTypeScript(code) {
  // TypeScript is executed as JavaScript in the browser
  return executeJavaScript(code);
}

/**
 * Main code execution function
 */
export async function executeCode(code, language) {
  if (!code || !code.trim()) {
    return [{ type: 'info', message: 'No code to execute' }];
  }

  try {
    switch (language) {
      case 'javascript':
        return executeJavaScript(code);
      case 'typescript':
        return executeTypeScript(code);
      case 'python':
        return await executePython(code);
      default:
        return [
          {
            type: 'info',
            message: `${language} execution is not yet supported. Supported languages: JavaScript, TypeScript, Python`
          }
        ];
    }
  } catch (error) {
    return [{ type: 'error', message: `Execution Error: ${error.message}` }];
  }
}
