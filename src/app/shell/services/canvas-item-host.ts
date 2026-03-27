/**
 * Shared protocol for layout systems that handle canvas-mode widget interaction.
 * Both DashboardLayoutEngine and SubpageTileCanvas implement this interface,
 * allowing generic document-level event routing without knowing the concrete type.
 */
export interface CanvasItemHost {
  readonly isInteracting: boolean;
  onDocumentMouseMove(event: MouseEvent): void;
  onDocumentMouseUp(): void;
}
