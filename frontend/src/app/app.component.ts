import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, HostListener, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Technology { id: string; name: string; available: boolean; }
interface Question { id: number; technology: string; phase: string; section: string; question: string; answer: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="shell">
      <header class="topbar">
        <a class="brand" href="#" aria-label="InterviewForge home">
          <span class="brand-mark"><span></span><span></span><span></span></span>
          <span>interview<span class="brand-light">forge</span></span>
        </a>
      </header>

      <main>
        <section class="intro">
          <div class="intro-copy">
            <div class="eyebrow"><span class="eyebrow-dot"></span> YOUR INTERVIEW PRACTICE SPACE</div>
            <h1>Know it when<br>it <em>counts.</em></h1>
            <p>Small, focused practice for the questions that move your career forward.</p>
          </div>
          <div class="orbit" aria-hidden="true">
            <div class="visual-card visual-back visual-back-two"></div>
            <div class="visual-card visual-back visual-back-one"></div>
            <div class="visual-card visual-front">
              <div class="visual-card-head"><span class="visual-index">01</span><span>PYTHON · FUNDAMENTALS</span><i></i></div>
              <div class="visual-question">What makes a<br><em>good answer?</em></div>
              <div class="visual-card-foot"><span></span> TAKE A MOMENT</div>
            </div>
            <span class="visual-tag">YOUR NEXT IDEA</span>
          </div>
        </section>

        <section class="selector-section" aria-label="Choose a subject">
          <div class="section-heading">
            <div><span class="overline">PICK UP WHERE YOU WANT</span><h2>Choose your track</h2></div>
            <span class="track-count">01 <span>/ 03</span></span>
          </div>
          <div class="tracks">
            <button *ngFor="let track of technologies" class="track" [class.active]="selectedTechnology === track.name"
              [class.disabled]="!track.available" (click)="selectTechnology(track.name)">
              <span class="track-icon" [ngClass]="track.id">{{ track.name === '.NET' ? 'N' : track.name === 'Angular' ? 'A' : 'Py' }}</span>
              <span class="track-copy"><strong>{{ track.name }}</strong><small>{{ track.available ? trackCounts[track.name] + ' questions to explore' : 'Coming soon' }}</small></span>
              <span class="track-arrow">↗</span>
            </button>
          </div>
        </section>

        <section class="study-section">
          <div class="study-head">
            <div class="study-title"><span class="overline">YOUR DECK</span><h2>{{ selectedTechnology }} <span>·</span> Interview cards</h2></div>
            <div class="study-tools">
              <button class="mode-button" (click)="toggleRandomMode()">{{ randomMode ? 'All cards' : 'Random practice' }}</button>
              <button class="add-button" (click)="showAddForm = !showAddForm">{{ showAddForm ? 'Close' : '+ Add card' }}</button>
              <label class="select-wrap phase-select-wrap"><span class="sr-only">Filter by phase</span>
                <select [(ngModel)]="selectedPhase" (ngModelChange)="onPhaseChange()">
                  <option value="">All phases</option><option *ngFor="let phase of phases" [value]="phase">{{ phase }}</option>
                </select><span class="select-caret">⌄</span>
              </label>
              <label class="select-wrap"><span class="sr-only">Filter by topic</span>
                <select [(ngModel)]="selectedSection" (ngModelChange)="loadQuestions()">
                  <option value="">All topics in phase</option><option *ngFor="let section of sections" [value]="section">{{ section }}</option>
                </select><span class="select-caret">⌄</span>
              </label>
              <div class="search-box"><span class="search-icon">⌕</span><input [(ngModel)]="search" (ngModelChange)="filterQuestions()" placeholder="Find a question" aria-label="Find a question"><kbd>⌘ K</kbd></div>
            </div>
          </div>

          <form class="add-form" *ngIf="showAddForm" (ngSubmit)="createQuestion()">
            <div class="form-heading"><div><span class="overline">GROW YOUR DECK</span><h3>Add a question and answer</h3></div><span class="form-note">Saved to your database</span></div>
            <div class="form-row"><label>Topic<input name="newSection" [(ngModel)]="newQuestion.section" placeholder="e.g. Functions" required></label>
              <label class="wide-field">Question<input name="newText" [(ngModel)]="newQuestion.question" placeholder="Write your interview question" required></label></div>
            <label>Answer<textarea name="newAnswer" [(ngModel)]="newQuestion.answer" placeholder="Keep it clear and concise" rows="3" required></textarea></label>
            <div class="form-actions"><span class="form-feedback" *ngIf="formMessage">{{ formMessage }}</span><button type="submit" [disabled]="saving">{{ saving ? 'Saving…' : 'Save card' }} <span>↗</span></button></div>
          </form>

          <div class="deck-meta" *ngIf="!loading && questions.length">
            <span><b>{{ filteredQuestions.length }}</b> {{ filteredQuestions.length === 1 ? 'card' : 'cards' }}<span *ngIf="selectedSection"> in {{ selectedSection }}</span></span>
            <span class="flip-hint" *ngIf="!randomMode"><span class="flip-symbol">↻</span> Click a card to reveal its answer</span>
            <span class="flip-hint" *ngIf="randomMode"><span class="flip-symbol">✳</span> Card {{ randomIndex + 1 }} of {{ randomDeck.length }} · no repeats this round</span>
          </div>

          <div class="loading-state" *ngIf="loading"><span class="spinner"></span> Loading your questions…</div>
          <div class="error-state" *ngIf="!loading && error"><span>Could not reach the API.</span> {{ error }}<button (click)="loadQuestions()">Try again</button></div>
          <div class="empty-state" *ngIf="!loading && !error && !filteredQuestions.length">
            <div class="empty-icon">✳</div><h3>{{ search ? 'No matches yet' : 'This track is warming up' }}</h3>
            <p>{{ search ? 'Try another phrase or clear your search.' : 'Questions for this subject will appear here soon.' }}</p>
          </div>

          <div class="cards-grid" *ngIf="!loading && !error && filteredQuestions.length && !randomMode">
            <ng-container *ngIf="!randomMode">
            <button class="flashcard" *ngFor="let card of filteredQuestions; let i = index" [class.flipped]="flipped.has(card.id)"
              (click)="flip(card.id)" [attr.aria-label]="(flipped.has(card.id) ? 'Answer: ' + card.answer : 'Question: ' + card.question) + '. Click to flip.'">
              <span class="card-face card-front">
                <span class="card-top"><span class="card-number">{{ (i + 1).toString().padStart(2, '0') }}</span><span class="card-section">{{ card.section }}</span></span>
                <span class="question-text">{{ card.question }}</span>
                <span class="card-bottom"><span>THINK IT THROUGH</span><span class="flip-icon">↻</span></span>
              </span>
              <span class="card-face card-back">
                <span class="card-top"><span class="answer-label"><span class="answer-dot"></span> A CLEAR ANSWER</span><span class="flip-icon">↻</span></span>
                <span class="answer-text">{{ card.answer }}</span>
                <span class="card-bottom"><span>{{ card.phase }}</span><span class="back-mark">✓</span></span>
              </span>
            </button>
            </ng-container>
          </div>
          <div class="random-practice" *ngIf="!loading && !error && randomMode && randomDeck.length">
            <button class="flashcard random-flashcard" [class.flipped]="flipped.has(randomDeck[randomIndex].id)"
              (click)="flip(randomDeck[randomIndex].id)"
              [attr.aria-label]="(flipped.has(randomDeck[randomIndex].id) ? 'Answer: ' + randomDeck[randomIndex].answer : 'Question: ' + randomDeck[randomIndex].question) + '. Click to flip.'">
              <span class="card-face card-front">
                <span class="card-top"><span class="card-number">{{ (randomIndex + 1).toString().padStart(2, '0') }}</span><span class="card-section">{{ randomDeck[randomIndex].section }}</span></span>
                <span class="question-text">{{ randomDeck[randomIndex].question }}</span>
                <span class="card-bottom"><span>THINK IT THROUGH</span><span class="flip-icon">↻</span></span>
              </span>
              <span class="card-face card-back">
                <span class="card-top"><span class="answer-label"><span class="answer-dot"></span> A CLEAR ANSWER</span><span class="flip-icon">↻</span></span>
                <span class="answer-text">{{ randomDeck[randomIndex].answer }}</span>
                <span class="card-bottom"><span>{{ randomDeck[randomIndex].phase }}</span><span class="back-mark">✓</span></span>
              </span>
            </button>
            <div class="random-controls">
              <span class="random-note">{{ randomIndex === randomDeck.length - 1 ? 'Last card in this round. Next will shuffle a new round.' : 'Take a moment to think, then reveal the answer.' }}</span>
              <div><button class="reveal-button" (click)="flip(randomDeck[randomIndex].id)">{{ flipped.has(randomDeck[randomIndex].id) ? 'Hide answer' : 'Reveal answer' }}</button>
                <button class="next-button" (click)="nextRandomCard()">{{ randomIndex === randomDeck.length - 1 ? 'New round' : 'Next card' }} <span>→</span></button></div>
            </div>
          </div>
          <div class="deck-footer" *ngIf="!loading && filteredQuestions.length"><span>Keep going, one card at a time.</span><span>{{ selectedTechnology }} <b>✳</b></span></div>
        </section>
      </main>
      <footer><span>Made for the next version of you.</span><span>INTERVIEWFORGE <b>© 2026</b></span></footer>
    </div>
  `
})
export class AppComponent implements OnInit {
  private http = inject(HttpClient);
  technologies: Technology[] = [
    { id: 'dotnet', name: '.NET', available: false },
    { id: 'angular', name: 'Angular', available: false },
    { id: 'python', name: 'Python', available: true },
  ];
  selectedTechnology = 'Python';
  phases: string[] = [];
  selectedPhase = '';
  sections: string[] = [];
  selectedSection = '';
  questions: Question[] = [];
  filteredQuestions: Question[] = [];
  trackCounts: Record<string, number> = { '.NET': 0, Angular: 0, Python: 0 };
  flipped = new Set<number>();
  randomMode = false;
  randomDeck: Question[] = [];
  randomIndex = 0;
  search = '';
  loading = true;
  error = '';
  showAddForm = false;
  saving = false;
  formMessage = '';
  newQuestion = { section: '', question: '', answer: '' };

  ngOnInit(): void {
    this.http.get<Technology[]>('/api/technologies').subscribe({
      next: (tracks) => { this.technologies = tracks; this.loadPhases(); },
      error: () => this.loadPhases(),
    });
  }

  selectTechnology(name: string): void {
    this.selectedTechnology = name;
    this.selectedPhase = '';
    this.selectedSection = '';
    this.search = '';
    this.flipped.clear();
    this.loadPhases();
  }

  loadPhases(): void {
    this.http.get<string[]>('/api/phases', { params: { technology: this.selectedTechnology } }).subscribe({
      next: (phases) => {
        this.phases = phases;
        if (this.selectedPhase && !phases.includes(this.selectedPhase)) this.selectedPhase = '';
        if (!this.selectedPhase && phases.length) this.selectedPhase = phases[0];
        this.loadQuestions();
      },
      error: () => { this.phases = []; this.loadQuestions(); },
    });
  }

  onPhaseChange(): void {
    this.selectedSection = '';
    this.loadQuestions();
  }

  loadQuestions(): void {
    this.loading = true;
    this.error = '';
    this.flipped.clear();
    let sectionParams = new HttpParams().set('technology', this.selectedTechnology);
    if (this.selectedPhase) sectionParams = sectionParams.set('phase', this.selectedPhase);
    this.http.get<string[]>('/api/sections', { params: sectionParams }).subscribe({
      next: (sections) => this.sections = sections,
      error: () => this.sections = [],
    });
    let params = new HttpParams().set('technology', this.selectedTechnology).set('limit', '2000');
    if (this.selectedPhase) params = params.set('phase', this.selectedPhase);
    if (this.selectedSection) params = params.set('section', this.selectedSection);
    this.http.get<Question[]>('/api/questions', { params }).subscribe({
      next: (items) => {
        this.questions = items;
        this.trackCounts[this.selectedTechnology] = items.length;
        this.filterQuestions();
        this.loading = false;
      },
      error: (err) => { this.error = err?.message || 'Check that the FastAPI server is running.'; this.loading = false; },
    });
  }

  filterQuestions(): void {
    const term = this.search.trim().toLowerCase();
    this.filteredQuestions = term ? this.questions.filter((item) => `${item.question} ${item.answer} ${item.section}`.toLowerCase().includes(term)) : this.questions;
    if (this.randomMode) this.shuffleRandomDeck();
  }

  flip(id: number): void {
    const updated = new Set(this.flipped);
    updated.has(id) ? updated.delete(id) : updated.add(id);
    this.flipped = updated;
  }

  toggleRandomMode(): void {
    this.randomMode = !this.randomMode;
    this.flipped.clear();
    if (this.randomMode) this.shuffleRandomDeck();
  }

  shuffleRandomDeck(): void {
    this.randomDeck = [...this.filteredQuestions];
    for (let i = this.randomDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.randomDeck[i], this.randomDeck[j]] = [this.randomDeck[j], this.randomDeck[i]];
    }
    this.randomIndex = 0;
    this.flipped.clear();
  }

  nextRandomCard(): void {
    if (!this.randomDeck.length) return;
    if (this.randomIndex === this.randomDeck.length - 1) this.shuffleRandomDeck();
    else this.randomIndex++;
    this.flipped.clear();
  }

  createQuestion(): void {
    this.saving = true;
    this.formMessage = '';
    this.http.post<Question>('/api/questions', {
      technology: this.selectedTechnology,
      phase: 'Custom questions',
      ...this.newQuestion,
    }).subscribe({
      next: () => {
        this.newQuestion = { section: '', question: '', answer: '' };
        this.formMessage = 'Card saved.';
        this.loadQuestions();
        this.showAddForm = false;
        this.saving = false;
      },
      error: () => { this.formMessage = 'Could not save this card. Check the API and try again.'; this.saving = false; },
    });
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      document.querySelector<HTMLInputElement>('.search-box input')?.focus();
    }
  }
}
