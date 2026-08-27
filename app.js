/**
 * 고등학생 맞춤형 진로 탐색 Web App (App A - Gemini)
 * Core Application Logic & Interactivity
 * (Domain-level top selection + Job-level subjectAffinity Rule-based scoring engine)
 */

document.addEventListener('DOMContentLoaded', () => {
  // State Management
  const state = {
    standardRatings: {}, // { subjectId: ratingValue (1~5) }
    customSubjects: [],  // [{ id, name, domainId, domainName, rating }]
    currentTopJobs: [],  // Top 2 calculated jobs
    exportFormat: 'png'  // 'png' or 'pdf'
  };

  // DOM Elements
  const sectionIntro = document.getElementById('section-intro');
  const sectionRating = document.getElementById('section-rating');
  const sectionResult = document.getElementById('section-result');

  const btnStart = document.getElementById('btn-start');
  const btnAnalyze = document.getElementById('btn-analyze');
  const btnBack = document.getElementById('btn-back');

  const standardContainer = document.getElementById('standard-subjects-container');
  const customNameInput = document.getElementById('custom-subject-name');
  const customDomainSelect = document.getElementById('custom-subject-domain');
  const customStarGroup = document.getElementById('custom-star-group');
  const btnAddCustom = document.getElementById('btn-add-custom');
  const customTagsContainer = document.getElementById('custom-tags-container');

  const jobsCardsContainer = document.getElementById('jobs-cards-container');

  // Modal Elements
  const btnOpenExport = document.getElementById('btn-open-export');
  const modalExport = document.getElementById('modal-export');
  const btnModalClose = document.getElementById('btn-modal-close');
  const btnModalCancel = document.getElementById('btn-modal-cancel');
  const btnDownloadExecute = document.getElementById('btn-download-execute');
  const studentNameInput = document.getElementById('student-name');
  const validationMsg = document.getElementById('modal-validation-msg');
  const formatBtns = document.querySelectorAll('.format-btn');

  // Printable Template Elements
  const reportHeaderTitle = document.getElementById('report-header-title');
  const reportHeaderDate = document.getElementById('report-header-date');
  const reportSubjectsList = document.getElementById('report-subjects-list');
  const reportCardsContainer = document.getElementById('report-cards-container');
  const reportPrintable = document.getElementById('report-printable');

  // Utility: HTML Escape for Security (M-2 fix)
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initialize Standard Subjects Rating UI
  function initStandardSubjects() {
    standardContainer.innerHTML = '';
    SUBJECT_MAPPING.forEach(subject => {
      // Default rating is 3
      if (!(subject.id in state.standardRatings)) {
        state.standardRatings[subject.id] = 3;
      }
      const currentRating = state.standardRatings[subject.id];

      const card = document.createElement('div');
      card.className = 'subject-card';
      card.innerHTML = `
        <div class="subject-info">
          <div class="subject-name">${escapeHTML(subject.name)}</div>
          <div class="subject-cat">${escapeHTML(subject.category)}</div>
        </div>
        <div class="star-rating" data-subject-id="${subject.id}">
          ${[1, 2, 3, 4, 5].map(val => `
            <i class="fa-${val <= currentRating ? 'solid' : 'regular'} fa-star ${val <= currentRating ? 'active' : ''}" data-value="${val}"></i>
          `).join('')}
        </div>
      `;
      standardContainer.appendChild(card);
    });

    // Attach Star Click Listeners for Standard Subjects
    standardContainer.querySelectorAll('.star-rating').forEach(starGroup => {
      const subjectId = starGroup.getAttribute('data-subject-id');
      starGroup.querySelectorAll('i').forEach(star => {
        star.addEventListener('click', (e) => {
          const val = parseInt(e.target.getAttribute('data-value'), 10);
          state.standardRatings[subjectId] = val;
          updateStarGroupUI(starGroup, val);
        });
      });
    });
  }

  // Update Star Component UI
  function updateStarGroupUI(groupEl, ratingVal) {
    groupEl.querySelectorAll('i').forEach(star => {
      const val = parseInt(star.getAttribute('data-value'), 10);
      if (val <= ratingVal) {
        star.className = 'fa-solid fa-star active';
      } else {
        star.className = 'fa-regular fa-star';
      }
    });
  }

  // Custom Subject Star Rating Interaction
  customStarGroup.querySelectorAll('i').forEach(star => {
    star.addEventListener('click', (e) => {
      const val = parseInt(e.target.getAttribute('data-value'), 10);
      customStarGroup.setAttribute('data-rating', val);
      updateStarGroupUI(customStarGroup, val);
    });
  });

  // Add Custom Subject Logic
  btnAddCustom.addEventListener('click', () => {
    const name = customNameInput.value.trim();
    const domainId = customDomainSelect.value;
    const rating = parseInt(customStarGroup.getAttribute('data-rating') || '4', 10);

    if (!name) {
      alert('과목명을 입력해 주세요.');
      customNameInput.focus();
      return;
    }
    if (!domainId) {
      alert('관련 계열을 선택해 주세요.');
      customDomainSelect.focus();
      return;
    }

    const domainObj = DOMAINS[domainId];
    const customItem = {
      id: 'custom_' + Date.now(),
      name: name,
      domainId: domainId,
      domainName: domainObj.name,
      rating: rating
    };

    state.customSubjects.push(customItem);
    renderCustomTags();

    // Reset Input Form
    customNameInput.value = '';
    customDomainSelect.selectedIndex = 0;
    customStarGroup.setAttribute('data-rating', 4);
    updateStarGroupUI(customStarGroup, 4);
  });

  // Render Custom Tags (Escaped)
  function renderCustomTags() {
    customTagsContainer.innerHTML = '';
    state.customSubjects.forEach((item, index) => {
      const tag = document.createElement('div');
      tag.className = 'custom-tag';
      tag.innerHTML = `
        <span>${DOMAINS[item.domainId].icon} <strong>${escapeHTML(item.name)}</strong> (${escapeHTML(item.domainName)} · ${item.rating}점)</span>
        <i class="fa-solid fa-xmark remove-btn" data-index="${index}"></i>
      `;
      customTagsContainer.appendChild(tag);
    });

    // Remove Event
    customTagsContainer.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        state.customSubjects.splice(idx, 1);
        renderCustomTags();
      });
    });
  }

  // Calculate Job-level Detail Fit Score within a specific Domain
  function calculateJobScoreInDomain(job, standardRatings, customSubjects) {
    let score = 0;

    // 1. Standard subjects affinity score
    SUBJECT_MAPPING.forEach(subject => {
      const rating = standardRatings[subject.id] || 3;
      const weight = (job.subjectAffinity && job.subjectAffinity[subject.id]) ? job.subjectAffinity[subject.id] : 0;
      score += rating * weight;
    });

    // 2. Custom subjects score bonus if matching domain
    customSubjects.forEach(custom => {
      if (custom.domainId === job.domainId) {
        score += custom.rating * 1.0;
      }
    });

    return score;
  }

  // Recommendation Scoring Engine (Rule-based 2-tier: Domain level -> Job level fit)
  function calculateTopJobs() {
    const startTime = performance.now();

    // Initialize Domain Scores & Primary Star Sums
    const domainScores = {};
    const primaryStarSums = {}; // For tie-breaking (ONLY 1.0 weight primary subjects)
    Object.keys(DOMAINS).forEach(dId => {
      domainScores[dId] = 0;
      primaryStarSums[dId] = 0;
    });

    // 1. Calculate 6 Domain Scores (Standard Subjects)
    SUBJECT_MAPPING.forEach(subject => {
      const rating = state.standardRatings[subject.id] || 3;
      if (subject.primaryDomain) {
        domainScores[subject.primaryDomain] += rating * subject.primaryWeight;
        if (subject.primaryWeight === 1.0) {
          primaryStarSums[subject.primaryDomain] += rating;
        }
      }
      if (subject.secondaryDomain) {
        domainScores[subject.secondaryDomain] += rating * subject.secondaryWeight;
      }
    });

    // 2. Calculate Custom Subjects Scores into Domain Scores
    state.customSubjects.forEach(custom => {
      if (custom.domainId in domainScores) {
        domainScores[custom.domainId] += custom.rating * 1.0;
        primaryStarSums[custom.domainId] += custom.rating;
      }
    });

    // 3. Sort Domains by Score (Tie-breaker: 1st Total Domain Score, 2nd 1.0 Primary Star Sum, 3rd Fixed Order)
    const fixedOrder = ['it', 'medical', 'engineering', 'humanities', 'business', 'arts_sports'];
    const sortedDomains = Object.keys(DOMAINS).sort((a, b) => {
      if (domainScores[b] !== domainScores[a]) {
        return domainScores[b] - domainScores[a];
      }
      if (primaryStarSums[b] !== primaryStarSums[a]) {
        return primaryStarSums[b] - primaryStarSums[a];
      }
      return fixedOrder.indexOf(a) - fixedOrder.indexOf(b);
    });

    const top1DomainId = sortedDomains[0];
    const top2DomainId = sortedDomains[1];

    // 4. Select Best Fitting Job within Top 1 Domain using subjectAffinity Rule
    const top1Candidates = JOBS_DATASET.filter(j => j.domainId === top1DomainId);
    top1Candidates.sort((a, b) => {
      const scoreA = calculateJobScoreInDomain(a, state.standardRatings, state.customSubjects);
      const scoreB = calculateJobScoreInDomain(b, state.standardRatings, state.customSubjects);
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      // Tie-breaker: Dataset order
      return JOBS_DATASET.indexOf(a) - JOBS_DATASET.indexOf(b);
    });
    const top1Job = top1Candidates[0] || JOBS_DATASET[0];

    // 5. Select Best Fitting Job within Top 2 Domain using subjectAffinity Rule
    const top2Candidates = JOBS_DATASET.filter(j => j.domainId === top2DomainId);
    top2Candidates.sort((a, b) => {
      const scoreA = calculateJobScoreInDomain(a, state.standardRatings, state.customSubjects);
      const scoreB = calculateJobScoreInDomain(b, state.standardRatings, state.customSubjects);
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      // Tie-breaker: Dataset order
      return JOBS_DATASET.indexOf(a) - JOBS_DATASET.indexOf(b);
    });
    const top2Job = top2Candidates[0] || JOBS_DATASET[1];

    const duration = performance.now() - startTime;
    console.log(`Recommendation calculated in ${duration.toFixed(3)}ms`);

    return [
      { job: top1Job, rank: 1, domainScore: domainScores[top1DomainId] },
      { job: top2Job, rank: 2, domainScore: domainScores[top2DomainId] }
    ];
  }

  // Get High-Rated Subjects Filtered for Specific Selected Job (QA Fix: Rationale alignment)
  function getHighRatedSubjectsForJob(job) {
    const high = [];
    const affinityKeys = job.subjectAffinity ? Object.keys(job.subjectAffinity) : [];

    // 1. Get subjects that have explicit subjectAffinity for this specific job and rating >= 4, sorted by score (rating * weight)
    const jobRelatedSubjects = [];
    SUBJECT_MAPPING.forEach(s => {
      if (affinityKeys.includes(s.id)) {
        const rating = state.standardRatings[s.id] || 3;
        const weight = job.subjectAffinity[s.id] || 0;
        if (rating >= 4) {
          jobRelatedSubjects.push({ name: s.name, score: rating * weight, rating: rating });
        }
      }
    });

    // Sort by weighted contribution descending
    jobRelatedSubjects.sort((a, b) => b.score - a.score);
    jobRelatedSubjects.forEach(item => high.push(item.name));

    // 2. Custom subjects matching domain with rating >= 4
    state.customSubjects.forEach(c => {
      if (c.rating >= 4 && c.domainId === job.domainId && !high.includes(c.name)) {
        high.push(c.name);
      }
    });

    // Fallback 1: If fewer than 3, check affinity subjects with rating >= 3
    if (high.length < 3) {
      const fallbackAffinitySubjects = [];
      SUBJECT_MAPPING.forEach(s => {
        if (affinityKeys.includes(s.id) && !high.includes(s.name)) {
          const rating = state.standardRatings[s.id] || 3;
          const weight = job.subjectAffinity[s.id] || 0;
          if (rating >= 3) {
            fallbackAffinitySubjects.push({ name: s.name, score: rating * weight });
          }
        }
      });
      fallbackAffinitySubjects.sort((a, b) => b.score - a.score);
      fallbackAffinitySubjects.forEach(item => {
        if (high.length < 3) high.push(item.name);
      });
    }

    // Fallback 2: Domain-level related subjects if still fewer than 3
    if (high.length < 3) {
      SUBJECT_MAPPING.forEach(s => {
        if (!high.includes(s.name) && (s.primaryDomain === job.domainId || s.secondaryDomain === job.domainId)) {
          if (high.length < 3) high.push(s.name);
        }
      });
    }

    return high.length > 0 ? high.slice(0, 3) : ['관심 교과목'];
  }

  // Render Result Cards
  function renderResultCards(topJobs) {
    jobsCardsContainer.innerHTML = '';

    topJobs.forEach(item => {
      const job = item.job;
      const card = document.createElement('div');
      card.className = `job-card rank-${item.rank}`;

      // QA Fix: Get job-specific high rated subjects for rationale
      const highSubjects = getHighRatedSubjectsForJob(job);
      const reasonText = job.reasonTemplate(highSubjects);

      card.innerHTML = `
        <div>
          <span class="rank-pill">Top ${item.rank} 추천 진로</span>
          <div class="job-header-row">
            <div class="job-title-group">
              <h3>${escapeHTML(job.name)}</h3>
              <div class="domain-tag">${DOMAINS[job.domainId].icon} ${escapeHTML(job.domainName)} 계열</div>
            </div>
            ${job.isRepresentativeRef ? '<span class="ref-badge" title="공식 직업정보의 대표·근사 직업 범위입니다."><i class="fa-solid fa-bookmark"></i> 대표 참고 직업 (근사대응)</span>' : ''}
          </div>

          <div class="reason-box">
            <i class="fa-solid fa-quote-left"></i> <strong>추천 이유:</strong> ${escapeHTML(reasonText)}
          </div>

          <div class="job-detail-section">
            <div class="detail-label"><i class="fa-solid fa-briefcase"></i> 주요 업무 및 역할</div>
            <div class="detail-content">${escapeHTML(job.tasks)}</div>
          </div>

          <div class="job-detail-section">
            <div class="detail-label"><i class="fa-solid fa-building-columns"></i> 관련 대학 학과</div>
            <div class="tag-list">
              ${job.majors.map(m => `<span class="mini-tag">${escapeHTML(m)}</span>`).join('')}
            </div>
          </div>

          <div class="job-detail-section">
            <div class="detail-label"><i class="fa-solid fa-book-open"></i> 권장 고교 학습 과목</div>
            <div class="tag-list">
              ${job.recommendedSubjects.map(s => `<span class="mini-tag">${escapeHTML(s)}</span>`).join('')}
            </div>
          </div>
        </div>

        <div class="job-footer-source">
          <span>공식 출처: ${escapeHTML(job.officialSource.name)}</span>
          <a href="${job.officialSource.url}" target="_blank" rel="noopener">상세 정보 보기 <i class="fa-solid fa-chevron-right"></i></a>
        </div>
      `;

      jobsCardsContainer.appendChild(card);
    });
  }

  // Navigation Logic
  btnStart.addEventListener('click', () => {
    switchSection(sectionIntro, sectionRating);
    initStandardSubjects();
  });

  btnAnalyze.addEventListener('click', () => {
    state.currentTopJobs = calculateTopJobs();
    renderResultCards(state.currentTopJobs);
    switchSection(sectionRating, sectionResult);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  btnBack.addEventListener('click', () => {
    // Return to Rating Screen (State is PRESERVED)
    switchSection(sectionResult, sectionRating);
    initStandardSubjects(); // Re-renders UI with preserved ratings
    renderCustomTags();     // Re-renders preserved custom tags
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function switchSection(fromEl, toEl) {
    fromEl.classList.remove('active');
    toEl.classList.add('active');
  }

  // Export Modal Interactivity
  btnOpenExport.addEventListener('click', () => {
    modalExport.classList.add('active');
    studentNameInput.value = '';
    validationMsg.style.display = 'none';
    studentNameInput.focus();
  });

  function closeModal() {
    modalExport.classList.remove('active');
  }

  btnModalClose.addEventListener('click', closeModal);
  btnModalCancel.addEventListener('click', closeModal);

  // Format Button Selection
  formatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      formatBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.exportFormat = btn.getAttribute('data-format');
    });
  });

  // Prepare Printable Report HTML Template
  function prepareReportTemplate(rawName) {
    const name = escapeHTML(rawName);
    const dateStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    reportHeaderTitle.innerText = `${rawName} 님의 진로 관심 탐색 결과 리포트`;
    reportHeaderDate.innerText = `생성일자: ${dateStr}`;

    // Fill Evaluated Subjects
    reportSubjectsList.innerHTML = '';
    SUBJECT_MAPPING.forEach(s => {
      const val = state.standardRatings[s.id] || 3;
      const item = document.createElement('div');
      item.innerHTML = `• ${escapeHTML(s.name)}: <strong>${val}점</strong>`;
      reportSubjectsList.appendChild(item);
    });
    state.customSubjects.forEach(c => {
      const item = document.createElement('div');
      item.innerHTML = `• [추가] ${escapeHTML(c.name)}: <strong>${escapeHTML(c.name)}</strong> (<strong>${c.rating}점</strong>)`;
      reportSubjectsList.appendChild(item);
    });

    // Clone Result Cards
    reportCardsContainer.innerHTML = jobsCardsContainer.innerHTML;
  }

  // Download Execute
  btnDownloadExecute.addEventListener('click', async () => {
    const name = studentNameInput.value.trim();
    if (!name) {
      validationMsg.innerText = '다운로드를 위해 학생 이름 또는 닉네임을 입력해 주세요.';
      validationMsg.style.display = 'block';
      studentNameInput.focus();
      return;
    }
    validationMsg.style.display = 'none';

    prepareReportTemplate(name);

    btnDownloadExecute.disabled = true;
    btnDownloadExecute.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 생성 중...';

    try {
      if (state.exportFormat === 'png') {
        // PNG Export
        const canvas = await html2canvas(reportPrintable, { scale: 2, useCORS: true });
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${name}_진로탐색리포트.png`;
        link.href = dataUrl;
        link.click();
      } else {
        // PDF Export
        const opt = {
          margin: 10,
          filename: `${name}_진로탐색리포트.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        await html2pdf().set(opt).from(reportPrintable).save();
      }
      closeModal();
    } catch (err) {
      console.error('Export Error:', err);
      alert('리포트 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      btnDownloadExecute.disabled = false;
      btnDownloadExecute.innerHTML = '<i class="fa-solid fa-download"></i> 리포트 다운로드';
    }
  });

  // Initial Load
  initStandardSubjects();
});
