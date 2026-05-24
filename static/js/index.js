window.HELP_IMPROVE_VIDEOJS = false;

// ─── Pipeline animation ──────────────────────────────────────
function initPipelineAnimation() {
  var items = document.querySelectorAll('#pipeline-anim .pipe-step, #pipeline-anim .pipe-arrow');
  if (!items.length) return;
  items.forEach(function(el, i) {
    setTimeout(function() { el.classList.add('visible'); }, i * 180 + 300);
  });
}

// ─── Attack type interactive cards ───────────────────────────
var ATTACK_INFO = {
  TEXT: {
    title: 'Type 1: Text Modification',
    desc: 'Manipulates on-scene text — e.g., changing "NO PARKING" to "FREE PARKING" — to reverse intended meanings or inject false instructions, deceiving both human users and perception systems.',
    detection: 'M(d)_i,t > χ²(k_d, α)  →  description embedding Mahalanobis distance exceeds chi-square threshold'
  },
  VISUAL: {
    title: 'Type 2: Visual Modification',
    desc: 'Distorts object appearance or placement — e.g., turning a green traffic light to red or relocating a stop sign — leading to recognition errors and misinformed user decisions.',
    detection: 'M(f)_i,t > χ²(k_f, α)  →  visual feature embedding Mahalanobis distance exceeds chi-square threshold'
  },
  OBSTRUCTION: {
    title: 'Type 3: Obstruction',
    desc: 'Targets critical information by occluding or deleting essential cues like exit signs, disrupting safety awareness and breaking expected perception graph relations.',
    detection: 'High-importance node (π ≥ π_high) absent for 2 consecutive frames → labeled obstruction attack'
  },
  INJECTION: {
    title: 'Type 4: Injection',
    desc: 'Introduces fictitious elements — fake hazard symbols, virtual labels — that embed misleading cues, divert user attention, and corrupt downstream reasoning processes.',
    detection: 'NodeSet first appears within last 2 frames AND reasonability ρ ≤ ρ_low  →  labeled injection attack'
  }
};

function initAttackCards() {
  var states = document.querySelectorAll('.fsm-state');
  var panel  = document.getElementById('fsm-info-panel');
  if (!states.length || !panel) return;

  states.forEach(function(el) {
    function activate() {
      states.forEach(function(s) { s.classList.remove('active'); });
      el.classList.add('active');
      var info = ATTACK_INFO[el.dataset.state];
      panel.innerHTML =
        '<div class="fsm-info-content">' +
          '<h4>' + info.title + '</h4>' +
          '<p>' + info.desc + '</p>' +
          '<span class="fsm-predicate">' + info.detection + '</span>' +
        '</div>';
    }
    el.addEventListener('click', activate);
    el.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') activate();
    });
  });
}

// ─── Accuracy comparison bar chart ───────────────────────────
function initAccuracyChart() {
  var el = document.getElementById('accuracy-chart');
  if (!el || typeof Chart === 'undefined') return;

  new Chart(el, {
    type: 'bar',
    data: {
      labels: ['Text', 'Visual', 'Obstruction', 'Injection', 'Non-attack'],
      datasets: [
        {
          label: 'CADAR (Ours)',
          data: [72.0, 73.4, 80.7, 75.6, 71.5],
          backgroundColor: '#363636'
        },
        {
          label: 'GPT-5-mini',
          data: [55.2, 53.7, 58.5, 60.9, 65.1],
          backgroundColor: '#3b82f6'
        },
        {
          label: 'Gemini-2.5-flash',
          data: [60.4, 53.9, 50.4, 60.3, 44.3],
          backgroundColor: '#8b5cf6'
        },
        {
          label: 'ViViT',
          data: [39.7, 28.0, 52.8, 35.2, 26.8],
          backgroundColor: '#f59e0b'
        },
        {
          label: '3D ResNet',
          data: [18.4, 10.6, 6.0, 11.6, 14.8],
          backgroundColor: '#ef4444'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 14 } },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              return ctx.dataset.label + ': ' + ctx.parsed.y.toFixed(1) + '%';
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        y: {
          min: 0, max: 100,
          ticks: {
            callback: function(v) { return v + '%'; },
            font: { size: 11 }
          },
          grid: { color: '#f0f0f0' }
        }
      }
    }
  });
}

// ─── Success bars animate-in on scroll ───────────────────────
function initSuccessBars() {
  var bars = document.querySelectorAll('.success-bar');
  if (!bars.length) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var el = entry.target;
        var target = el.style.width;
        el.style.width = '0%';
        requestAnimationFrame(function() {
          el.style.transition = 'width 1s cubic-bezier(0.4,0,0.2,1)';
          el.style.width = target;
        });
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.3 });
  bars.forEach(function(b) { observer.observe(b); });
}

// ─── Sortable comparison table ────────────────────────────────
function initSortableTable() {
  var table = document.getElementById('comparison-table');
  if (!table) return;
  var headers = table.querySelectorAll('th.sortable');
  var sortState = { col: null, asc: true };

  headers.forEach(function(th) {
    th.addEventListener('click', function() {
      var colIdx = parseInt(this.dataset.col, 10);
      if (sortState.col === colIdx) { sortState.asc = !sortState.asc; }
      else { sortState.col = colIdx; sortState.asc = true; }

      var tbody = table.querySelector('tbody');
      var rows  = Array.from(tbody.querySelectorAll('tr'));

      rows.sort(function(a, b) {
        var aCells = a.querySelectorAll('td');
        var bCells = b.querySelectorAll('td');
        if (!aCells[colIdx] || !bCells[colIdx]) return 0;
        var aEl = aCells[colIdx];
        var bEl = bCells[colIdx];
        var aV = aEl.dataset.val !== undefined ? parseFloat(aEl.dataset.val) : aEl.textContent.trim().toLowerCase();
        var bV = bEl.dataset.val !== undefined ? parseFloat(bEl.dataset.val) : bEl.textContent.trim().toLowerCase();
        if (typeof aV === 'number' && typeof bV === 'number') {
          return sortState.asc ? aV - bV : bV - aV;
        }
        return sortState.asc ? String(aV).localeCompare(String(bV)) : String(bV).localeCompare(String(aV));
      });

      rows.forEach(function(r) { tbody.appendChild(r); });

      headers.forEach(function(h) {
        h.querySelector('.sort-icon').className = 'fas fa-sort sort-icon';
      });
      this.querySelector('.sort-icon').className =
        'fas fa-sort-' + (sortState.asc ? 'up' : 'down') + ' sort-icon';
    });
  });
}

// ─── BibTeX copy button ───────────────────────────────────────
function initBibTexCopy() {
  var btn   = document.getElementById('bibtex-copy-btn');
  var label = document.getElementById('bibtex-copy-label');
  var icon  = document.getElementById('bibtex-copy-icon');
  var code  = document.getElementById('bibtex-code');
  if (!btn || !code) return;

  btn.addEventListener('click', function() {
    navigator.clipboard.writeText(code.textContent).then(function() {
      btn.classList.add('copied');
      icon.className = 'fas fa-check';
      label.textContent = 'Copied!';
      setTimeout(function() {
        btn.classList.remove('copied');
        icon.className = 'fas fa-copy';
        label.textContent = 'Copy';
      }, 2000);
    });
  });
}

// ─── Navbar burger ────────────────────────────────────────────
function initNavbar() {
  $('.navbar-burger').click(function() {
    $('.navbar-burger').toggleClass('is-active');
    $('.navbar-menu').toggleClass('is-active');
  });
}

// ─── Image modal ──────────────────────────────────────────────
function setupImageModal() {
  var modal = document.getElementById('image-modal');
  if (!modal) return;
  var modalImage = document.getElementById('modal-image');
  var closeBtns  = modal.querySelectorAll('.modal-background, .modal-close');

  $(document).on('click', '.figure-block img', function() {
    modalImage.src = this.src;
    modalImage.alt = this.alt || '';
    modal.classList.add('is-active');
  });

  closeBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      modal.classList.remove('is-active');
      modalImage.src = '';
    });
  });

  document.addEventListener('keyup', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('is-active')) {
      modal.classList.remove('is-active');
      modalImage.src = '';
    }
  });
}

// ─── Figure scroll-fade ───────────────────────────────────────
function initFigureAnimations() {
  var figs = document.querySelectorAll('.figure-block');
  if (!figs.length) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  figs.forEach(function(f) { observer.observe(f); });
}

// ─── Boot ─────────────────────────────────────────────────────
$(document).ready(function() {
  initNavbar();
  initPipelineAnimation();
  initAttackCards();
  initAccuracyChart();
  initSuccessBars();
  initSortableTable();
  initBibTexCopy();
  setupImageModal();
  initFigureAnimations();
});
