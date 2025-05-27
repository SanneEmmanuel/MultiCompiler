// Languages and initial code
const languages = {
  c: {
    name: 'C',
    initialCode: `#include <stdio.h>\n\nint main() {\n    printf("Hello from C!\\n");\n    return 0;\n}`
  },
  cpp: {
    name: 'C++',
    initialCode: `#include <iostream>\n\nint main() {\n    std::cout << "Hello from C++!" << std::endl;\n    return 0;\n}`
  },
  go: {
    name: 'Go',
    initialCode: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from Go!")\n}`
  },
  v: {
    name: 'V',
    initialCode: `fn main() {\n    println('Hello from V!')\n}`
  },
  carbon: {
    name: 'Carbon',
    initialCode: `// Carbon is experimental\nfunc main() -> i32 {\n  println("Hello from Carbon!")\n  return 0\n}`
  }
};

const tabsContainer = document.getElementById('tabs');
const editorArea = document.getElementById('editor-area');
const terminal = document.getElementById('terminal');
const compileBtn = document.getElementById('compileBtn');

let currentLang = 'c';
let editors = {}; // language -> textarea element
let codeData = {};

// Setup tabs and editors
function setupEditors() {
  for (const lang in languages) {
    // Create tab
    const tab = document.createElement('div');
    tab.classList.add('tab');
    if (lang === currentLang) tab.classList.add('active');
    tab.textContent = languages[lang].name;
    tab.dataset.lang = lang;
    tabsContainer.appendChild(tab);

    tab.addEventListener('click', () => {
      if (currentLang === lang) return;

      // Save current code
      codeData[currentLang] = editors[currentLang].value;

      // Switch tab active state
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Show editor for selected lang
      switchEditor(lang);
    });

    // Create editor textarea
    const textarea = document.createElement('textarea');
    textarea.classList.add('editor-textarea');
    textarea.spellcheck = false;
    textarea.value = languages[lang].initialCode;
    if (lang === currentLang) textarea.classList.add('active');
    editorArea.appendChild(textarea);

    editors[lang] = textarea;
    codeData[lang] = languages[lang].initialCode;
  }
}

// Switch editor textarea visibility
function switchEditor(lang) {
  editors[currentLang].classList.remove('active');
  currentLang = lang;
  editors[currentLang].classList.add('active');
  terminal.classList.remove('visible');
  terminal.style.display = 'none';
  terminal.textContent = '';
}

// Show terminal with output
function showTerminal(output) {
  terminal.textContent = output;
  terminal.classList.add('visible');
  terminal.style.display = 'block';
  terminal.scrollTop = terminal.scrollHeight;
}

// Compile code using APIs
async function compileCode() {
  // Save current code
  codeData[currentLang] = editors[currentLang].value;
  const code = codeData[currentLang];
  terminal.textContent = 'Compiling...';
  terminal.classList.add('visible');
  terminal.style.display = 'block';

  try {
    if (currentLang === 'go') {
      // Go Playground API
      const resp = await fetch('https://play.golang.org/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: code, version: 2 })
      });
      const data = await resp.json();
      let output = data.Errors || data.Events.map(e => e.Message).join('') || 'No output';
      showTerminal(output);
    } else if (currentLang === 'c' || currentLang === 'cpp') {
      // Judge0 API (without key - limited)
      const langMap = { c: 50, cpp: 54 };
      const language_id = langMap[currentLang];

      const response = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // If using rapidapi you need API key here, else use other Judge0 endpoint
        },
        body: JSON.stringify({
          source_code: code,
          language_id: language_id,
          stdin: ''
        })
      });

      if (!response.ok) throw new Error(`Compilation failed: ${response.statusText}`);
      const result = await response.json();

      let output = result.stdout || result.compile_output || result.stderr || '';
      if (!output) output = 'No output';
      showTerminal(output);
    } else {
      showTerminal(`${languages[currentLang].name} compilation is not supported yet.`);
    }
  } catch (err) {
    showTerminal(`Error: ${err.message}`);
  }
}

// Initialize
setupEditors();

compileBtn.addEventListener('click', compileCode);

// Optional: add shortcut Ctrl+Enter to compile
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    compileCode();
  }
});
