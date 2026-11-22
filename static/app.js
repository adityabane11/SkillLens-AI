(() => {
  const fileInput = document.getElementById('resume-file');
  const dropzone = document.getElementById('dropzone');
  const fileTitle = document.getElementById('file-title');
  const fileSubtitle = document.getElementById('file-subtitle');
  const description = document.getElementById('job-description');
  const charCount = document.getElementById('char-count');
  const sampleButton = document.getElementById('sample-button');
  const sampleJob = document.getElementById('sample-job');
  const form = document.getElementById('analysis-form');
  const analyzeButton = document.getElementById('analyze-button');
  const toast = document.getElementById('toast');
  let toastTimer;
  function notify(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }
  function showFile(file) {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext)) {
      notify('Please choose a PDF, DOCX, or TXT file.');
      if (fileInput) fileInput.value = '';
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      notify('This file is larger than the 8 MB limit.');
      if (fileInput) fileInput.value = '';
      return;
    }
    fileTitle.textContent = file.name;
    fileSubtitle.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB · Ready to analyze`;
    dropzone.classList.add('has-file');
  }
  if (fileInput) fileInput.addEventListener('change', () => showFile(fileInput.files[0]));
  if (dropzone) {
    ['dragenter', 'dragover'].forEach(type => dropzone.addEventListener(type, event => {
      event.preventDefault(); dropzone.classList.add('dragover');
    }));
    ['dragleave', 'drop'].forEach(type => dropzone.addEventListener(type, event => {
      event.preventDefault(); dropzone.classList.remove('dragover');
    }));
    dropzone.addEventListener('drop', event => {
      const file = event.dataTransfer.files[0];
      if (!file) return;
      const transfer = new DataTransfer(); transfer.items.add(file); fileInput.files = transfer.files; showFile(file);
    });
  }
  if (description && charCount) {
    const updateCount = () => { charCount.textContent = description.value.length.toLocaleString(); };
    description.addEventListener('input', updateCount); updateCount();
  }
  if (sampleButton && sampleJob && description) {
    sampleButton.addEventListener('click', () => {
      description.value = sampleJob.value.trim();
      description.dispatchEvent(new Event('input', { bubbles: true }));
      description.focus(); notify('Sample job description added. You can edit it before analyzing.');
    });
  }
  if (form && analyzeButton) {
    form.addEventListener('submit', event => {
      if (!fileInput.files.length) { event.preventDefault(); notify('Please choose a resume first.'); return; }
      if (!description.value.trim()) { event.preventDefault(); notify('Add a job description to continue.'); return; }
      analyzeButton.disabled = true;
      analyzeButton.querySelector('.button-label').textContent = 'Analyzing resume…';
      analyzeButton.querySelector('.button-arrow').textContent = '◌';
    });
  }
  document.querySelectorAll('.copy-tip').forEach(button => button.addEventListener('click', async () => {
    const value = button.dataset.copy || '';
    try {
      await navigator.clipboard.writeText(value);
      button.textContent = 'Copied'; notify('Recommendation copied to clipboard.');
      setTimeout(() => { button.textContent = 'Copy'; }, 1500);
    } catch (_) { notify(value); }
  }));

  // Interactive, skill-specific learning roadmaps. Progress is saved locally per skill.
  const roadmapModal = document.getElementById('roadmap-modal');
  const roadmapSteps = document.getElementById('roadmap-steps');
  const roadmapTitle = document.getElementById('roadmap-title');
  const roadmapIntro = document.getElementById('roadmap-intro');
  const progressLabel = document.getElementById('roadmap-progress-label');
  const progressPercent = document.getElementById('roadmap-progress-percent');
  const progressFill = document.getElementById('roadmap-progress-fill');
  let activeRoadmapSkill = '';
  const roadmapPlans = {
    communication: [
      ['Learn clear communication basics', 'Practise active listening, concise explanations, and organizing your thoughts before speaking.', 'Write a short summary of a topic in 5 clear sentences.'],
      ['Explain a technical project', 'Describe a project’s problem, your approach, the tools you used, and the result in plain language.', 'Record a 2-minute explanation of one project and listen back.'],
      ['Practise interview answers', 'Use the STAR structure (Situation, Task, Action, Result) for examples about teamwork or problem-solving.', 'Prepare and practise answers to 3 common interview questions.'],
      ['Get feedback and improve', 'Ask a classmate to review your explanation for clarity, pace, and structure.', 'Repeat your project explanation after applying the feedback.']
    ],
    python: [
      ['Review Python fundamentals', 'Revise data types, conditions, loops, functions, collections, and exception handling.', 'Solve 5 small Python exercises without copying solutions.'],
      ['Practise clean, reusable code', 'Break a task into functions and handle invalid inputs and errors.', 'Build a command-line task tracker or expense tracker.'],
      ['Use files and APIs', 'Practise reading and writing files, JSON, and making HTTP requests.', 'Create a small script that reads data and produces a summary.'],
      ['Build and document a project', 'Create a project that demonstrates your Python skills and write clear setup instructions.', 'Publish the project with a README and add it to your resume if completed.']
    ],
    flask: [
      ['Learn Flask routes and requests', 'Practise routes, GET/POST methods, request data, templates, and responses.', 'Build a small form that accepts input and displays a result.'],
      ['Validate user input', 'Handle missing fields, invalid values, and helpful error messages.', 'Add server-side validation to your form.'],
      ['Connect a database', 'Learn basic CRUD operations using SQLite or MySQL.', 'Build a mini notes or task application.'],
      ['Test and document the app', 'Test normal and invalid requests, then document how to run the project.', 'Add a README and screenshots to your project repository.']
    ],
    'rest api': [
      ['Understand HTTP and REST', 'Learn GET, POST, PUT/PATCH, DELETE, status codes, and resource-based URLs.', 'Write down the endpoints for a simple task app.'],
      ['Build JSON endpoints', 'Create endpoints that accept and return JSON with meaningful status codes.', 'Build a small Flask API with two or three endpoints.'],
      ['Validate and handle errors', 'Check request bodies and return consistent error responses.', 'Test missing fields and invalid IDs.'],
      ['Test and document the API', 'Use a REST client or curl and write example requests and responses.', 'Create a short API README.']
    ],
    sql: [
      ['Review query fundamentals', 'Practise SELECT, WHERE, ORDER BY, and aggregate functions.', 'Write 10 queries against a sample database.'],
      ['Learn joins and grouping', 'Practise INNER/LEFT JOIN, GROUP BY, and HAVING.', 'Answer 5 questions that combine data from two tables.'],
      ['Understand database design', 'Review primary keys, foreign keys, constraints, and normalization basics.', 'Design a small database for a student or task app.'],
      ['Apply SQL in a project', 'Connect a database to an application and test common queries.', 'Document the schema and include the project in your portfolio when finished.']
    ],
    mysql: [
      ['Set up a practice database', 'Create a database and tables with primary and foreign keys.', 'Create a small database for students, tasks, or inventory.'],
      ['Practise everyday SQL', 'Use SELECT, INSERT, UPDATE, DELETE, joins, and aggregates.', 'Complete 10 queries on your practice data.'],
      ['Connect an application', 'Connect a Python or Flask app using safe parameterized queries.', 'Build a basic CRUD feature.'],
      ['Review integrity and document', 'Add constraints, test edge cases, and document setup steps.', 'Write a README with schema and example queries.']
    ],
    git: [
      ['Learn the everyday commands', 'Practise status, add, commit, log, diff, and restore.', 'Make a repository and commit a small change.'],
      ['Use branches safely', 'Create a branch, make a change, and merge it back.', 'Complete a feature on a separate branch.'],
      ['Practise collaboration basics', 'Learn pull, push, remotes, pull requests, and conflict resolution.', 'Create and merge a test pull request if you have a second account or collaborator.'],
      ['Keep a useful project history', 'Use clear commit messages and document the project.', 'Review your repository and improve its README.']
    ],
    github: [
      ['Create a clear repository', 'Use a descriptive name, add a README, and include setup instructions.', 'Improve the README of one existing project.'],
      ['Publish project code', 'Learn how to push commits and keep your default branch organized.', 'Push a small completed project.'],
      ['Show evidence of your work', 'Add screenshots, usage examples, and a clear list of features.', 'Add a screenshot and usage section to your README.'],
      ['Maintain the repository', 'Use meaningful commits and remove secrets or unnecessary generated files.', 'Review repository files before sharing the link.']
    ],
    html: [
      ['Strengthen semantic HTML', 'Practise headings, forms, labels, links, lists, and accessible structure.', 'Build a clean single-page profile.'],
      ['Create responsive layouts', 'Use CSS Flexbox/Grid and responsive breakpoints.', 'Make your page work on mobile and desktop.'],
      ['Improve accessibility', 'Check labels, keyboard focus, contrast, and image alt text.', 'Test the page using only the keyboard.'],
      ['Publish a small project', 'Polish content and verify all links and forms.', 'Deploy the finished page and add it to your portfolio.']
    ],
    css: [
      ['Review CSS foundations', 'Practise the box model, selectors, spacing, typography, and colors.', 'Style a simple profile card.'],
      ['Learn layout tools', 'Use Flexbox and CSS Grid to create consistent layouts.', 'Build a responsive two-column section.'],
      ['Add responsive behavior', 'Use media queries and test multiple viewport widths.', 'Check your page at phone, tablet, and desktop sizes.'],
      ['Polish and validate', 'Check focus states, readable contrast, and spacing consistency.', 'Apply the improvements to one portfolio project.']
    ],
    javascript: [
      ['Review core JavaScript', 'Practise variables, functions, arrays, objects, and conditionals.', 'Solve 5 small exercises.'],
      ['Work with the DOM', 'Select elements, handle events, and update page content.', 'Build a to-do list with add and complete actions.'],
      ['Handle data and errors', 'Practise JSON, fetch, promises, and try/catch.', 'Load sample data and show a useful error state.'],
      ['Finish a small interactive app', 'Test input validation and make the interface usable on mobile.', 'Document the app and publish it.']
    ],
    react: [
      ['Learn component fundamentals', 'Practise JSX, reusable components, props, and component composition.', 'Split a page into 3 reusable components.'],
      ['Manage state and events', 'Use state and event handlers to update the interface.', 'Build a counter or task list.'],
      ['Work with forms and effects', 'Practise controlled inputs and loading data with effects.', 'Create a searchable list from sample data.'],
      ['Build and publish a project', 'Organize files, handle empty states, and test responsiveness.', 'Publish a small React project with a README.']
    ],
    'problem solving': [
      ['Build a repeatable approach', 'Restate the problem, identify inputs/outputs, and try small examples.', 'Solve 3 easy problems and write down your approach.'],
      ['Practise core patterns', 'Work on arrays, strings, hash maps, searching, and sorting.', 'Solve 5 beginner problems across these topics.'],
      ['Check edge cases and complexity', 'Test empty inputs, duplicates, and large values; estimate time and space complexity.', 'Revisit one solution and improve it.'],
      ['Explain your reasoning', 'Practise explaining a solution before coding and reviewing it afterward.', 'Write a short explanation for two solved problems.']
    ],
    teamwork: [
      ['Understand collaboration habits', 'Practise active listening, sharing updates, and clarifying responsibilities.', 'Write a simple task split for a group project.'],
      ['Work with shared tasks', 'Agree on small deliverables, deadlines, and how progress will be communicated.', 'Complete a small group or paired coding task.'],
      ['Handle feedback constructively', 'Ask clarifying questions and focus feedback on the work, not the person.', 'Review a peer’s work and apply feedback to your own.'],
      ['Reflect on the result', 'Identify your contribution and what you would improve next time.', 'Document your actual contribution for future interviews.']
    ]
  };
  const genericRoadmap = skill => [
    [`Understand ${skill}`, `Learn the core concepts and common terminology for ${skill}.`, `Write a short summary of the 5 most important concepts.`],
    [`Practise ${skill} fundamentals`, `Follow a beginner exercise or tutorial focused on ${skill}.`, `Complete 3 practice exercises and note any difficulties.`],
    [`Apply ${skill} in a mini-project`, `Use ${skill} to solve a small, concrete problem related to your target role.`, `Build one small example that demonstrates the skill.`],
    [`Review and show your progress`, `Test your work, note what you learned, and document the result honestly.`, `Save your work and add it to your portfolio or study notes.`]
  ];
  function roadmapStorageKey(skill) { return `skilllens-roadmap-v1:${skill.toLowerCase()}`; }
  function readRoadmapProgress(skill) {
    try { return JSON.parse(localStorage.getItem(roadmapStorageKey(skill)) || '[]'); }
    catch (_) { return []; }
  }
  function updateRoadmapProgress() {
    if (!roadmapSteps) return;
    const checks = [...roadmapSteps.querySelectorAll('input[type="checkbox"]')];
    const completed = checks.filter(check => check.checked).length;
    const percent = checks.length ? Math.round(completed / checks.length * 100) : 0;
    progressLabel.textContent = `${completed} of ${checks.length} steps complete`;
    progressPercent.textContent = `${percent}%`;
    progressFill.style.width = `${percent}%`;
    try { localStorage.setItem(roadmapStorageKey(activeRoadmapSkill), JSON.stringify(checks.map(check => check.checked))); }
    catch (_) { /* Roadmap remains usable if browser storage is disabled. */ }
  }
  function openRoadmap(skill) {
    if (!roadmapModal || !roadmapSteps) return;
    activeRoadmapSkill = (skill || 'skill').trim().toLowerCase();
    const title = activeRoadmapSkill.replace(/\b\w/g, letter => letter.toUpperCase());
    const plan = roadmapPlans[activeRoadmapSkill] || genericRoadmap(activeRoadmapSkill);
    roadmapTitle.textContent = `${title} learning roadmap`;
    roadmapIntro.textContent = `A practical four-step plan to explore ${title.toLowerCase()} because it appears in the job description but was not detected in the resume text.`;
    const saved = readRoadmapProgress(activeRoadmapSkill);
    roadmapSteps.innerHTML = '';
    plan.forEach((step, index) => {
      const item = document.createElement('label');
      item.className = 'roadmap-step';
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.checked = Boolean(saved[index]);
      check.setAttribute('aria-label', `Mark step ${index + 1} complete`);
      const body = document.createElement('span');
      body.className = 'roadmap-step-body';
      const heading = document.createElement('strong'); heading.textContent = step[0];
      const detail = document.createElement('span'); detail.className = 'roadmap-step-detail'; detail.textContent = step[1];
      const task = document.createElement('span'); task.className = 'roadmap-step-task';
      const taskLabel = document.createElement('b'); taskLabel.textContent = 'Try this: ';
      task.append(taskLabel, document.createTextNode(step[2]));
      body.append(heading, detail, task);
      item.append(check, body);
      roadmapSteps.append(item);
      check.addEventListener('change', updateRoadmapProgress);
    });
    roadmapModal.hidden = false;
    document.body.classList.add('roadmap-open');
    const close = roadmapModal.querySelector('.roadmap-close');
    if (close) close.focus();
    updateRoadmapProgress();
  }
  function closeRoadmap() {
    if (!roadmapModal) return;
    roadmapModal.hidden = true;
    document.body.classList.remove('roadmap-open');
  }
  document.querySelectorAll('[data-skill].roadmap-trigger, .roadmap-skill-button').forEach(button => {
    button.addEventListener('click', () => openRoadmap(button.dataset.skill));
  });
  document.querySelectorAll('[data-close-roadmap]').forEach(button => button.addEventListener('click', closeRoadmap));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && roadmapModal && !roadmapModal.hidden) closeRoadmap();
  });

  const exportButton = document.getElementById('download-report');
  if (exportButton) exportButton.addEventListener('click', () => {
    const results = document.getElementById('results');
    if (!results) return;
    const text = results.innerText.replace(/\n{3,}/g, '\n\n').trim() + '\n\nGenerated by SkillLens AI — academic prototype. Not a hiring decision.';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'skilllens-analysis-report.txt';
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
    notify('Your report has been exported.');
  });
  if (document.getElementById('results')) setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
})();
