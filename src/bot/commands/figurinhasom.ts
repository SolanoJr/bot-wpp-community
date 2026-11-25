/** Versao demo — este recurso e exclusivo da versao completa. */
import { ICommand } from './types';
import { groupTag } from './format';
import { demoMessage } from '../../services/licenseService';

export const figurinhasomCommand: ICommand = {
  name: 'figurinhasom',
  description: '[demo] Recurso da versao completa.',
  async execute(ctx) {
    await ctx.reply(demoMessage() + groupTag(ctx));
  },
};
