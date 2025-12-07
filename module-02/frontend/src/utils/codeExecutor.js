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
    // Check if already loading
    if (window.pyodideLoadingPromise) {
      return await window.pyodideLoadingPromise;
    }

    // Create loading promise to avoid multiple loads
    window.pyodideLoadingPromise = (async () => {
      // Load Pyodide from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js';
      script.async = true;
      document.head.appendChild(script);

      // Wait for Pyodide to be available
      return new Promise((resolve, reject) => {
        const checkPyodide = setInterval(() => {
          if (window.loadPyodide) {
            clearInterval(checkPyodide);
            
            // Initialize Pyodide
            window.loadPyodide({
              indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/'
            }).then(pyodide => {
              pyodideInstance = pyodide;
              isPyodideReady = true;
              resolve(pyodide);
            }).catch(reject);
          }
        }, 100);

        // Timeout after 15 seconds
        setTimeout(() => {
          clearInterval(checkPyodide);
          reject(new Error('Pyodide loading timeout - took too long to initialize'));
        }, 15000);

        script.onerror = () => {
          clearInterval(checkPyodide);
          reject(new Error('Failed to load Pyodide script from CDN'));
        };
      });
    })();

    pyodideInstance = await window.pyodideLoadingPromise;
    return pyodideInstance;
  } catch (error) {
    console.error('Failed to initialize Pyodide:', error);
    window.pyodideLoadingPromise = null;
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

  // Save original window.print to prevent accidental prints
  const originalPrint = window.print;
  window.print = () => {
    console.warn('Print function blocked during code execution');
  };

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
  } finally {
    // Restore original window.print
    window.print = originalPrint;
  }

  return output;
}

/**
 * Execute Python code using Pyodide (WASM)
 */
async function executePython(code) {
  const output = [];

  try {
    // Save original window.print to prevent accidental prints
    const originalPrint = window.print;
    window.print = () => {
      console.warn('Print function blocked during code execution');
    };

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
    } finally {
      // Restore original window.print
      window.print = originalPrint;
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
