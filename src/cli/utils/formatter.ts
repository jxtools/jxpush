/**
 * CLI Utilities - Formatters
 * Colored console output and table formatting
 */

import chalk from 'chalk';
import Table from 'cli-table3';

export class Formatter {
  /**
   * Format success message
   */
  static success(message: string): string {
    return chalk.green('✓ ') + chalk.white(message);
  }

  /**
   * Format error message
   */
  static error(message: string): string {
    return chalk.red('✗ ') + chalk.white(message);
  }

  /**
   * Format warning message
   */
  static warning(message: string): string {
    return chalk.yellow('⚠ ') + chalk.white(message);
  }

  /**
   * Format info message
   */
  static info(message: string): string {
    return chalk.blue('ℹ ') + chalk.white(message);
  }

  /**
   * Format header
   */
  static header(message: string): string {
    return chalk.bold.cyan(message);
  }

  /**
   * Format key-value pair
   */
  static keyValue(key: string, value: string): string {
    return chalk.gray(key + ':') + ' ' + chalk.white(value);
  }

  /**
   * Create results table
   */
  static createResultsTable(results: Array<{ status: string; message: string; token?: string }>) {
    const table = new Table({
      head: [chalk.cyan('Status'), chalk.cyan('Token'), chalk.cyan('Message')],
      colWidths: [10, 40, 50],
      wordWrap: true,
    });

    results.forEach((result) => {
      const statusIcon = result.status === 'success' ? chalk.green('✓') : chalk.red('✗');

      table.push([
        statusIcon + ' ' + result.status,
        result.token ? result.token.substring(0, 37) + '...' : 'N/A',
        result.message,
      ]);
    });

    return table.toString();
  }

  /**
   * Create summary table
   */
  static createSummaryTable(summary: {
    total: number;
    success: number;
    failed: number;
    duration: number;
  }) {
    const table = new Table({
      head: [chalk.cyan('Metric'), chalk.cyan('Value')],
      colWidths: [20, 20],
    });

    table.push(
      ['Total Messages', summary.total.toString()],
      [chalk.green('Successful'), summary.success.toString()],
      [chalk.red('Failed'), summary.failed.toString()],
      ['Duration', `${summary.duration}ms`],
      ['Success Rate', `${((summary.success / summary.total) * 100).toFixed(2)}%`]
    );

    return table.toString();
  }

  /**
   * Create queue status table
   */
  static createQueueStatusTable(status: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }) {
    const table = new Table({
      head: [chalk.cyan('Queue Status'), chalk.cyan('Count')],
      colWidths: [20, 15],
    });

    table.push(
      [chalk.yellow('Pending'), status.pending.toString()],
      [chalk.blue('Processing'), status.processing.toString()],
      [chalk.green('Completed'), status.completed.toString()],
      [chalk.red('Failed'), status.failed.toString()]
    );

    return table.toString();
  }

  /**
   * Progress bar
   */
  static progressBar(current: number, total: number, width: number = 40): string {
    const percentage = Math.floor((current / total) * 100);
    const filled = Math.floor((current / total) * width);
    const empty = width - filled;

    const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
    return `${bar} ${percentage}% (${current}/${total})`;
  }

  /**
   * Spinner frames
   */
  private static spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private static spinnerIndex = 0;

  static spinner(message: string): string {
    const frame = this.spinnerFrames[this.spinnerIndex];
    this.spinnerIndex = (this.spinnerIndex + 1) % this.spinnerFrames.length;
    return chalk.cyan(frame) + ' ' + chalk.white(message);
  }
}
