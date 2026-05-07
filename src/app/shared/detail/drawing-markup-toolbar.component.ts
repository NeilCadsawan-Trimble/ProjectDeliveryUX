import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

export interface DrawingTool {
  icon: string;
  label: string;
  svgSrc?: string;
}

export const DRAWING_TOOLS: DrawingTool[] = [
  { icon: '', label: 'Draw', svgSrc: 'draw' },
  { icon: '', label: 'Revision cloud', svgSrc: 'revision-cloud' },
  { icon: '', label: 'Shape', svgSrc: 'shape' },
  { icon: 'link', label: 'Link' },
  { icon: '', label: 'Text box', svgSrc: 'text-box' },
  { icon: 'camera', label: 'Capture' },
  { icon: '', label: 'Palette', svgSrc: 'palette' },
  { icon: '', label: 'Fill & Opacity', svgSrc: 'fill-opacity' },
  { icon: 'remove', label: 'Line & Border' },
  { icon: '', label: 'Text Size', svgSrc: 'text-size' },
  { icon: '', label: 'Measure', svgSrc: 'measure' },
];

@Component({
  selector: 'app-drawing-markup-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="outerClass()">
      <div [class]="innerClass()">
        @for (tool of tools(); track tool.label) {
          <div class="w-8 h-8 rounded flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150 relative"
            [class.bg-muted]="activeTool() === tool.label"
            role="button" tabindex="0" [attr.aria-label]="tool.label"
            (click)="selectTool(tool.label)" (mousedown)="$event.stopPropagation()">
            @if (tool.svgSrc === 'draw') {
              <svg class="w-5 h-5 text-foreground" viewBox="12 12 24 24" fill="none" aria-hidden="true">
                <path d="M27.728 21.6861L26.314 20.2721L17 29.5861V31.0001H18.414L27.728 21.6861ZM29.142 20.2721L30.556 18.8581L29.142 17.4441L27.728 18.8581L29.142 20.2721ZM19.242 33.0001H15V28.7571L28.435 15.3221C28.6225 15.1346 28.8768 15.0293 29.142 15.0293C29.4072 15.0293 29.6615 15.1346 29.849 15.3221L32.678 18.1511C32.8655 18.3386 32.9708 18.5929 32.9708 18.8581C32.9708 19.1232 32.8655 19.3776 32.678 19.5651L19.242 33.0001Z" fill="currentColor"/>
              </svg>
            } @else if (tool.svgSrc === 'revision-cloud') {
              <svg class="w-5 h-5 text-foreground" viewBox="12 12 24 24" fill="none" aria-hidden="true">
                <path d="M21.3015 13.9465C18.6584 12.7109 17.1577 12.6583 14.4593 13.9465C12.3966 16.6876 12.8031 18.1164 14.4593 20.6056C12.4553 23.7078 12.5727 25.3608 14.4593 28.216C12.8914 30.1721 12.8977 31.3166 14.4593 32.9726C17.4831 34.4907 18.8778 34.0447 21.3015 32.9726C23.8953 34.5668 25.4166 34.0983 28.1438 32.9726C30.7169 34.3321 31.6738 34.0991 33.0311 32.9726C34.4424 30.899 34.1833 29.6199 33.0311 27.2647C34.3527 24.545 34.1869 23.1023 33.0311 20.6056C34.3886 18.1211 34.2557 16.6517 33.0311 13.9465C31.0351 12.6543 29.9694 12.7199 28.1438 13.9465C25.5546 12.6889 24.0618 12.7005 21.3015 13.9465Z" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            } @else if (tool.svgSrc === 'shape') {
              <svg class="w-5 h-5 text-foreground" viewBox="12 12 24 24" fill="none" aria-hidden="true">
                <rect x="15" y="15" width="18" height="18" stroke="currentColor" stroke-width="2"/>
              </svg>
            } @else if (tool.svgSrc === 'text-box') {
              <svg class="w-5 h-5 text-foreground" viewBox="12 12 24 24" fill="none" aria-hidden="true">
                <path d="M17 17V31H31V17H17ZM16 15H32C32.2652 15 32.5196 15.1054 32.7071 15.2929C32.8946 15.4804 33 15.7348 33 16V32C33 32.2652 32.8946 32.5196 32.7071 32.7071C32.5196 32.8946 32.2652 33 32 33H16C15.7348 33 15.4804 32.8946 15.2929 32.7071C15.1054 32.5196 15 32.2652 15 32V16C15 15.7348 15.1054 15.4804 15.2929 15.2929C15.4804 15.1054 15.7348 15 16 15ZM25 22V29H23V22H19V20H29V22H25Z" fill="currentColor"/>
              </svg>
            } @else if (tool.svgSrc === 'palette') {
              <svg class="w-5 h-5 text-foreground" viewBox="12 12 24 24" fill="none" aria-hidden="true">
                <path d="M24 14C29.522 14 34 17.978 34 22.889C33.9992 24.3622 33.4136 25.7748 32.3717 26.8165C31.3299 27.8581 29.9172 28.4435 28.444 28.444H26.478C25.556 28.444 24.811 29.189 24.811 30.111C24.811 30.533 24.978 30.922 25.233 31.211C25.5 31.511 25.667 31.9 25.667 32.333C25.667 33.256 24.9 34 24 34C18.478 34 14 29.522 14 24C14 18.478 18.478 14 24 14ZM22.811 30.111C22.8106 29.6293 22.9052 29.1523 23.0893 28.7072C23.2735 28.2622 23.5436 27.8578 23.8842 27.5172C24.2248 27.1766 24.6292 26.9065 25.0742 26.7223C25.5193 26.5382 25.9963 26.4436 26.478 26.444H28.444C29.3866 26.4435 30.2905 26.0689 30.9572 25.4026C31.6239 24.7363 31.9989 23.8326 32 22.89C32 19.139 28.468 16 24 16C21.9356 15.9981 19.9503 16.7944 18.4594 18.2223C16.9684 19.6501 16.0872 21.5991 15.9999 23.6617C15.9126 25.7243 16.626 27.7408 17.991 29.2895C19.3559 30.8383 21.2668 31.7994 23.324 31.972C22.9892 31.4093 22.812 30.7658 22.811 30.111ZM19.5 24C19.1022 24 18.7206 23.842 18.4393 23.5607C18.158 23.2794 18 22.8978 18 22.5C18 22.1022 18.158 21.7206 18.4393 21.4393C18.7206 21.158 19.1022 21 19.5 21C19.8978 21 20.2794 21.158 20.5607 21.4393C20.842 21.7206 21 22.1022 21 22.5C21 22.8978 20.842 23.2794 20.5607 23.5607C20.2794 23.842 19.8978 24 19.5 24ZM28.5 24C28.1022 24 27.7206 23.842 27.4393 23.5607C27.158 23.2794 27 22.8978 27 22.5C27 22.1022 27.158 21.7206 27.4393 21.4393C27.7206 21.158 28.1022 21 28.5 21C28.8978 21 29.2794 21.158 29.5607 21.4393C29.842 21.7206 30 22.1022 30 22.5C30 22.8978 29.842 23.2794 29.5607 23.5607C29.2794 23.842 28.8978 24 28.5 24ZM24 21C23.6022 21 23.2206 20.842 22.9393 20.5607C22.658 20.2794 22.5 19.8978 22.5 19.5C22.5 19.1022 22.658 18.7206 22.9393 18.4393C23.2206 18.158 23.6022 18 24 18C24.3978 18 24.7794 18.158 25.0607 18.4393C25.342 18.7206 25.5 19.1022 25.5 19.5C25.5 19.8978 25.342 20.2794 25.0607 20.5607C24.7794 20.842 24.3978 21 24 21Z" fill="currentColor"/>
              </svg>
            } @else if (tool.svgSrc === 'fill-opacity') {
              <svg class="w-5 h-5 text-foreground" viewBox="12 12 24 24" fill="none" aria-hidden="true">
                <path d="M17.636 18.636L24 12.272L30.364 18.636C31.6227 19.8946 32.4798 21.4983 32.8271 23.2441C33.1743 24.9899 32.9961 26.7995 32.3149 28.4441C31.6337 30.0886 30.4802 31.4942 29.0001 32.4831C27.5201 33.4721 25.78 33.9999 24 33.9999C22.22 33.9999 20.4799 33.4721 18.9999 32.4831C17.5198 31.4942 16.3663 30.0886 15.6851 28.4441C15.0039 26.7995 14.8257 24.9899 15.1729 23.2441C15.5202 21.4983 16.3773 19.8946 17.636 18.636ZM19.05 20.05C18.0707 21.0292 17.4038 22.2769 17.1338 23.6352C16.8638 24.9935 17.0028 26.4014 17.5331 27.6807C18.0635 28.96 18.9614 30.0532 20.1132 30.8221C21.2651 31.5909 22.6191 32.0009 24.004 32L24 15.1L19.05 20.05Z" fill="currentColor"/>
              </svg>
            } @else if (tool.svgSrc === 'text-size') {
              <svg class="w-5 h-5 text-foreground" viewBox="12 12 24 24" fill="none" aria-hidden="true">
                <path d="M22 18V33H20V18H14V16H28V18H22ZM30 26V33H28V26H25V24H33V26H30Z" fill="currentColor"/>
              </svg>
            } @else if (tool.svgSrc === 'measure') {
              <svg class="w-5 h-5 text-foreground" viewBox="12 12 24 24" fill="none" aria-hidden="true">
                <path d="M18.343 26.6209L15.515 29.4499L19.05 32.9849L32.485 19.5499L28.95 16.0149L26.828 18.1359L28.243 19.5499L26.828 20.9639L25.414 19.5499L23.293 21.6719L25.414 23.7919L24 25.2079L21.879 23.0869L19.757 25.2079L21.172 26.6219L19.757 28.0369L18.343 26.6209ZM29.657 13.8929L34.607 18.8429C34.7945 19.0304 34.8998 19.2847 34.8998 19.5499C34.8998 19.815 34.7945 20.0694 34.607 20.2569L19.757 35.1069C19.5695 35.2944 19.3152 35.3997 19.05 35.3997C18.7848 35.3997 18.5305 35.2944 18.343 35.1069L13.393 30.1569C13.2055 29.9694 13.1002 29.715 13.1002 29.4499C13.1002 29.1847 13.2055 28.9304 13.393 28.7429L28.243 13.8929C28.4305 13.7054 28.6848 13.6001 28.95 13.6001C29.2152 13.6001 29.4695 13.7054 29.657 13.8929Z" fill="currentColor"/>
              </svg>
            } @else {
              <i class="modus-icons text-2xl text-foreground" aria-hidden="true">{{ tool.icon }}</i>
            }
            <svg class="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 text-foreground-40" viewBox="0 0 6 6" fill="currentColor" aria-hidden="true">
              <path d="M6 0V6H0L6 0Z"/>
            </svg>
          </div>
        }
      </div>
    </div>
  `,
})
export class DrawingMarkupToolbarComponent {
  readonly tools = input<DrawingTool[]>(DRAWING_TOOLS);
  readonly activeTool = input<string>('Draw');
  /**
   * Default `horizontal` keeps the bottom-center placement used by the
   * drawing-detail view and the home-page widget. `vertical` floats the
   * toolbar at the right-center of the parent (positioned ancestor)
   * with a stacked column of icons; used by the Models 3D viewer where
   * the bottom edge is reserved for revision/capture date controls.
   */
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly toolSelect = output<string>();

  readonly outerClass = computed(() =>
    this.orientation() === 'vertical'
      ? 'absolute inset-y-0 right-3 z-10 flex items-center justify-center pointer-events-none'
      : 'absolute bottom-3 left-0 right-0 z-10 flex justify-center pointer-events-none',
  );

  readonly innerClass = computed(() =>
    this.orientation() === 'vertical'
      ? 'flex flex-col items-center gap-1 bg-card border-default rounded-lg px-1.5 py-3 shadow-toolbar pointer-events-auto'
      : 'flex items-center gap-1 bg-card border-default rounded-lg px-3 py-1.5 shadow-toolbar pointer-events-auto',
  );

  selectTool(label: string): void {
    this.toolSelect.emit(label);
  }
}
