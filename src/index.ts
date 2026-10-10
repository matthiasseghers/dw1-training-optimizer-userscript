import { log } from './utils';
import { createCustomTable } from './ui-renderer';
import { attachEventListeners } from './event-handlers';
import { monitorTable } from './observers';

/**
 * Main entry point for the userscript.
 * Initializes the Digimon World 1 Training Optimizer.
 */
function main(): void {
  log('Training Optimizer initializing...');

  // Create the custom optimizer table with Current/Goal/Result columns
  createCustomTable();

  // Attach event listeners to input fields
  attachEventListeners();

  // Monitor the training table for changes
  monitorTable();

  log('Training Optimizer initialized successfully!');
}

// Entry point — with @run-at document-end, the DOM is already loaded.
main();
