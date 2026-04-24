import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';
import type { LearningPlan } from '../../../data/dashboard-data.types';

@Component({
  selector: 'app-home-learning-progress',
  imports: [ModusTypographyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: flex; flex-direction: column; height: 100%; min-height: 0; }'],
  template: `
    <div class="flex flex-col h-full min-h-0">
      <div class="flex-shrink-0 flex flex-col gap-3 px-4 pb-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ plan().name }}</modus-typography>
          </div>
          <modus-typography hierarchy="p" size="xs" className="text-foreground-60">
            {{ plan().completedCourses }} of {{ plan().totalCourses }} courses
          </modus-typography>
        </div>

        <div class="flex flex-col gap-1">
          <div class="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              class="h-full rounded-full bg-primary transition-all duration-300"
              [style.width.%]="progressPercent()"
            ></div>
          </div>
          <div class="flex items-center justify-between">
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60">{{ progressPercent() }}% complete</modus-typography>
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60">{{ totalHoursLogged() }}h logged</modus-typography>
          </div>
        </div>
      </div>

      <div class="flex-1 min-h-0 overflow-y-auto px-4 pb-4 mb-5">
        <div class="flex flex-col gap-1.5">
          @for (course of plan().courses; track course.id) {
          <div class="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted transition-colors duration-150">
            @if (course.status === 'completed') {
              <i class="modus-icons text-base text-success flex-shrink-0" aria-hidden="true">check_circle</i>
            } @else if (course.status === 'in-progress') {
              <i class="modus-icons text-base text-primary flex-shrink-0" aria-hidden="true">play_circle</i>
            } @else {
              <i class="modus-icons text-base text-foreground-40 flex-shrink-0" aria-hidden="true">circle_outline</i>
            }

            <div class="min-w-0 flex-1">
              <a
                [href]="course.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm text-foreground hover:text-primary truncate block transition-colors duration-150"
              >{{ course.title }}</a>
              <modus-typography hierarchy="p" size="xs" className="text-foreground-60">{{ course.category }}</modus-typography>
            </div>

            <div class="flex-shrink-0 w-16 text-right">
              @if (course.status === 'completed') {
                <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-success">Done</modus-typography>
              } @else if (course.status === 'in-progress') {
                <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-primary">{{ coursePercent(course) }}%</modus-typography>
              } @else {
                <modus-typography hierarchy="p" size="xs" className="text-foreground-40">{{ courseDuration(course) }}</modus-typography>
              }
            </div>
          </div>
        }
        </div>
      </div>
    </div>
  `,
})
export class HomeLearningProgressComponent {
  readonly plan = input.required<LearningPlan>();

  readonly progressPercent = computed(() => {
    const p = this.plan();
    if (!p.totalCourses) return 0;
    return Math.round((p.completedCourses / p.totalCourses) * 100);
  });

  readonly totalHoursLogged = computed(() => {
    const minutes = this.plan().courses.reduce((sum, c) => sum + c.completedMinutes, 0);
    return Math.round(minutes / 60);
  });

  coursePercent(course: { durationMinutes: number; completedMinutes: number }): number {
    if (!course.durationMinutes) return 0;
    return Math.round((course.completedMinutes / course.durationMinutes) * 100);
  }

  courseDuration(course: { durationMinutes: number }): string {
    const hours = Math.round(course.durationMinutes / 60);
    return `${hours}h`;
  }
}
