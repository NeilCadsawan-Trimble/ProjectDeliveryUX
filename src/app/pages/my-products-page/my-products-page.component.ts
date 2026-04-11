import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

interface ProductEntry {
  title: string;
  description: string;
  links: { label: string }[];
  bullets?: string[];
}

const PRODUCTS: ProductEntry[] = [
  {
    title: 'SketchUp',
    description: 'To manage your SketchUp account and access your subscription, visit the Account Management Portal. You can also manage your classic licenses, get support, or download SketchUp.',
    links: [
      { label: 'Account Management Portal' },
      { label: 'classic licenses' },
      { label: 'support' },
      { label: 'download SketchUp' },
    ],
  },
  {
    title: 'Trimble MEP Estimating',
    description: 'For assistance with Trimble MEP estimating products not listed here, contact support at mepsupport@trimble.com, or manage your organization\'s licenses in the License Management Portal.',
    links: [{ label: 'License Management Portal' }],
  },
  {
    title: 'Trimble MEP Detailing',
    description: 'For assistance with Trimble MEP North America detailing products not listed here, such as MEPcontent for Fabrication and SysQue, contact support at mepsupport@trimble.com, or manage your organization\'s licenses in the BD Licensing Portal.',
    links: [{ label: 'BD Licensing Portal' }],
  },
  {
    title: 'Total Estimating (UK)',
    description: 'For assistance with Total Estimating products, please Contact Support, or manage your organization\'s licenses in the License Management Portal.',
    links: [
      { label: 'Contact Support' },
      { label: 'License Management Portal' },
    ],
  },
  {
    title: 'Estimation MEP (UK)',
    description: 'For assistance with Estimation MEP, please Contact Support, or manage your organization\'s licenses in the License Management Portal.',
    links: [
      { label: 'Contact Support' },
      { label: 'License Management Portal' },
    ],
  },
  {
    title: 'WinEst',
    description: 'For assistance with WinEst or Modelogix estimating products not listed here, contact support at winestsupport@trimble.com.',
    links: [],
  },
  {
    title: 'Stabicad',
    description: 'To download the latest version of Stabicad, visit the Download page. You can also Contact Support, or manage your licenses in the License Management Portal.',
    links: [
      { label: 'Download page' },
      { label: 'Contact Support' },
      { label: 'License Management Portal' },
    ],
  },
  {
    title: 'LiveCount (Benelux)',
    description: 'For assistance with LiveCount, please Contact Support, or manage your licenses in the License Management Portal.',
    links: [
      { label: 'Contact Support' },
      { label: 'License Management Portal' },
    ],
  },
  {
    title: 'Tekla Software',
    description: 'Download your Tekla software, find support at Tekla User Assistance, or manage your organization\'s licenses in the Tekla Online Admin Tool.',
    links: [
      { label: 'Tekla software' },
      { label: 'Tekla User Assistance' },
      { label: 'Tekla Online Admin Tool' },
    ],
  },
  {
    title: 'Trimble Viewpoint',
    description: 'Login and manage access to your Trimble Viewpoint solution(s) at www.viewpoint.com by selecting your region and navigating to the "Login" option at the top right of the page. You can find Support, the Viewpoint Learning Center, Knowledge Base and all release information, within the Viewpoint Support Portal.',
    links: [{ label: 'Viewpoint Support Portal' }],
  },
  {
    title: 'Trimble Electrical Designer 2D',
    description: 'For support or to download the latest version of Trimble Electrical Designer 2D, visit:',
    links: [],
    bullets: ['United Kingdom: Community Portal', 'Netherlands: Support Portal'],
  },
  {
    title: 'Nova',
    description: 'To download the latest version of Trimble Nova and manage your licenses, visit the Trimble Community portal.',
    links: [{ label: 'Trimble Community portal' }],
  },
];

@Component({
  selector: 'app-my-products-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col min-h-full bg-background">
      <div class="w-full max-w-[960px] mx-auto px-6 py-8 flex flex-col gap-6 flex-1">

        <div class="text-center flex flex-col gap-2">
          <div class="text-2xl font-bold text-foreground">My Products</div>
          <div class="text-sm text-foreground-60">
            Once an admin assigns you a license, you'll see it here. If you were assigned
            a license but don't see it here, please try refreshing the page.
          </div>
        </div>

        <!-- Can't find your product? -->
        <div class="bg-muted rounded-lg p-5 flex flex-col gap-1">
          <div class="text-sm font-bold text-foreground">Can't find your product?</div>
          <div class="text-sm text-foreground-60">
            If you were using a different portal to access assigned products before, you may be able to find what you're looking for here.
          </div>
        </div>

        <!-- Products grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 border-default rounded-lg overflow-hidden bg-card">
          @for (product of products; track product.title; let i = $index) {
            <div
              class="p-5 flex flex-col gap-2 border-default"
              [class.border-bottom-default]="i < products.length - 2"
              [class.border-right-default]="i % 2 === 0"
            >
              <div class="text-sm font-bold text-foreground">{{ product.title }}</div>
              <div class="text-xs text-foreground-60 leading-relaxed">{{ product.description }}</div>
              @if (product.bullets) {
                <div class="flex flex-col gap-0.5 ml-4">
                  @for (bullet of product.bullets; track bullet) {
                    <div class="text-xs text-foreground-60 leading-relaxed flex items-start gap-1">
                      <div class="mt-1.5 w-1 h-1 rounded-full bg-foreground-40 flex-shrink-0"></div>
                      <div>{{ bullet }}</div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Bottom row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="flex flex-col gap-1">
            <div class="text-sm font-bold text-foreground">Admin Console</div>
            <div class="text-xs text-foreground-60">
              Are you an admin looking to manage your subscriptions? Head over to
              <div class="inline font-semibold text-foreground cursor-pointer underline decoration-warning decoration-2 underline-offset-4">Admin Console</div>.
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <div class="text-sm text-foreground-60">Still having trouble?</div>
            <div class="text-sm font-semibold text-foreground cursor-pointer underline decoration-warning decoration-2 underline-offset-4">Contact us</div>
          </div>
        </div>

      </div>

      <div class="w-full bg-foreground text-background px-8 py-6">
        <div class="max-w-[960px] mx-auto grid grid-cols-[auto_1fr_auto] gap-8 items-start">
          <div class="flex flex-col gap-1 flex-shrink-0">
            <div class="text-lg font-bold tracking-tight">Trimble.</div>
            <div class="text-2xs text-background-60">&copy; {{ currentYear }}, Trimble Inc.</div>
          </div>
          <div class="text-2xs leading-relaxed text-background-60">
            Trimble is a global technology company that connects the physical and digital worlds, transforming the ways work gets done. With relentless innovation in precise positioning, modeling and data analytics, Trimble enables essential industries including construction, geospatial and transportation. Whether it's helping customers build and maintain infrastructure, design and construct buildings, optimize global supply chains or map the world, Trimble is at the forefront, driving productivity and progress.
          </div>
          <div class="flex flex-col gap-1 text-xs flex-shrink-0">
            <div class="cursor-pointer hover:underline">Legal Terms and Conditions</div>
            <div class="cursor-pointer hover:underline">Website Terms of Use</div>
            <div class="cursor-pointer hover:underline">Privacy Center</div>
            <div class="cursor-pointer hover:underline">Privacy Notice</div>
            <div class="cursor-pointer hover:underline">California Notice at Collection</div>
            <div class="cursor-pointer hover:underline">Your Privacy Choices (US)</div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class MyProductsPageComponent {
  readonly products = PRODUCTS;
  readonly currentYear = new Date().getFullYear();
}
