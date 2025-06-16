import { fetchBangs } from './bang';

export class Autocomplete {
    private input: HTMLInputElement;
    private container: HTMLDivElement;
    private bangs: Record<string, string> = {};
    private bangKeys: string[] = [];

    constructor(inputId: string, containerId: string) {
        this.input = document.getElementById(inputId) as HTMLInputElement;
        this.container = document.getElementById(containerId) as HTMLDivElement;
        
        // Initialize bangs data
        this.initializeBangs();
        this.setupEventListeners();
    }

    private async initializeBangs(): Promise<void> {
        try {
            this.bangs = await fetchBangs();
            this.bangKeys = this.bangs.map(item => item.t)
        } catch (error) {
            console.error('Failed to fetch bangs:', error);
        }
    }

    private setupEventListeners(): void {
        // Listen for input changes to show autocomplete suggestions
        this.input.addEventListener('input', () => this.updateSuggestions());

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target !== this.input && !this.container.contains(e.target as Node)) {
                this.hideSuggestions();
            }
        });

        // Handle keyboard navigation
        this.input.addEventListener('keydown', (e) => {
            const suggestions = this.container.querySelectorAll('.autocomplete-item');
            
            if (suggestions.length === 0) return;

            // Down arrow
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateSuggestions(1, suggestions);
            }
            // Up arrow
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateSuggestions(-1, suggestions);
            }
            // Enter
            else if (e.key === 'Enter') {
                const activeItem = this.container.querySelector('.active') as HTMLElement;
                if (activeItem) {
                    e.preventDefault();
                    this.selectSuggestion(activeItem.dataset.bang || '');
                }
            }
            // Escape
            else if (e.key === 'Escape') {
                this.hideSuggestions();
            }
        });
    }

    private updateSuggestions(): void {
        const query = this.input.value.trim();
        
        // Check if we're typing a bang
        if (query.includes('!!')) {
            const parts = query.split('!!');
            const lastPart = parts[parts.length - 1].toLowerCase();

            // If we're in the middle of typing a bang, show suggestions
            if (lastPart !== '') {
                const suggestions = this.bangKeys
                    .filter(bang => bang.toLowerCase().startsWith(lastPart))
                    .slice(0, 5);  // Limit to 5 suggestions
                
                this.showSuggestions(suggestions, query, lastPart);
                return;
            }
        }
        
        this.hideSuggestions();
    }

    private showSuggestions(suggestions: string[], query: string, lastPart: string): void {
        // Clear previous suggestions
        this.container.innerHTML = '';
        
        if (suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }

        // Create suggestion elements
        suggestions.forEach(bang => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.dataset.bang = bang;
            
            // Highlight the matching part
            const highlightedBang = `<strong>${bang.substring(0, lastPart.length)}</strong>${bang.substring(lastPart.length)}`;
            
            // Show the URL the bang points to
            const bangObj = this.bangs.find(b => b.t === bang);
            item.innerHTML = `!!${highlightedBang} <span class="bang-url">${bangObj.s}</span>`;
            
            // Handle click on suggestion
            item.addEventListener('click', () => {
                this.selectSuggestion(bang);
            });
            
            this.container.appendChild(item);
        });
        
        // Show the container
        this.container.style.display = 'block';
    }

    private hideSuggestions(): void {
        this.container.style.display = 'none';
        this.container.innerHTML = '';
    }

    private navigateSuggestions(direction: number, suggestions: NodeListOf<Element>): void {
        const currentActive = this.container.querySelector('.active');
        let nextIndex = 0;
        
        if (currentActive) {
            const currentIndex = Array.from(suggestions).indexOf(currentActive);
            nextIndex = (currentIndex + direction + suggestions.length) % suggestions.length;
            currentActive.classList.remove('active');
        } else if (direction < 0) {
            nextIndex = suggestions.length - 1;
        }
        
        suggestions[nextIndex].classList.add('active');
    }

    private selectSuggestion(bang: string): void {
        const query = this.input.value;
        const parts = query.split('!!');
        
        // Replace the last part with the selected bang
        parts[parts.length - 1] = bang + ' ';
        
        this.input.value = parts.join('!!');
        this.hideSuggestions();
        this.input.focus();
    }
}
