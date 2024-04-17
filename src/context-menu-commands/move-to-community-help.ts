import {
  ApplicationCommandType,
  Client,
  ContextMenuCommandBuilder,
  GuildMember,
  MessageContextMenuCommandInteraction,
} from 'discord.js';
import { ContextMenuCommand } from '../types';
import { isCommunityHelpThread } from '../helpers/is-community-help';
import { getCommunityHelpChannel } from '../helpers/get-community-help-channel';

export const MoveToCommunityHelp: ContextMenuCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Move to Community-Help')
    .setType(ApplicationCommandType.Message),
  run: async (client: Client, interaction: MessageContextMenuCommandInteraction) => {
    if (!interaction.channel || !interaction.guild || isCommunityHelpThread(interaction.channel)) {
      await interaction.followUp({
        ephemeral: true,
        content: 'You cannot use this command in a community-help thread.',
      });
      return;
    }
    if (!interaction.member || !interaction.inCachedGuild() || !hasPermission(interaction.member)) {
      await interaction.followUp({
        ephemeral: true,
        content: 'You do not have permission to move this message to community-help.',
      });
      return;
    }

    // create new thread in community help
    const communityHelpChannel = getCommunityHelpChannel(interaction.guild);
    const availableTags = communityHelpChannel.availableTags;
    const unansweredTagID: string | undefined = availableTags.find(
      (tag) =>
        // check if includes "solve" or equals "answered"
        tag.name.toLowerCase().includes('unsolve') || tag.name.toLowerCase() === 'unanswered',
    )?.id;
    if (!unansweredTagID) {
      await interaction.followUp({
        ephemeral: true,
        content: 'Could not find the unanswered tag.',
      });
      return;
    }

    const messageContent: string = interaction.targetMessage.content as string;
    if (!messageContent) {
      await interaction.followUp({
        ephemeral: true,
        content: 'You cannot use this command on a message without content.',
      });
      return;
    }

    /// TODO: Handle attachements
    let attachmentFiles: any = [];

    if (interaction.targetMessage.attachments) {
      const attachments = interaction.targetMessage.attachments.toJSON();

      // If there are any attachments, fetch them
      /*if (attachments.length > 0) {
        for (let i = 0; i < attachments.length; i++) {
          let response = await fetch(attachments[i].url);
          //let buffer = await response.buffer();

          //console.log('Handling attachment...', attachments, response)

         // let file = new Attachment(buffer, attachments[i].name);

        }
      }*/
      attachmentFiles = attachments;
    }

    let attachmentStrings = ''
    if(attachmentFiles && attachmentFiles.length) {
      attachmentStrings =  '\n\nAttachments:\n' + attachmentFiles.map((attachment: any) => attachment.url).join('\n');
    }


    const thread = await communityHelpChannel.threads.create({
      name: messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent,
      message: {
        content:
          messageContent +
          attachmentStrings +
          '\n\n**Original message from <@' +
          interaction.targetMessage.author.id +
          '>' +
          ' - Moved from <#' +
          interaction.channel.id +
          '>**'
      },
      appliedTags: [unansweredTagID],
    });
    await thread.members.add(interaction.targetMessage.author);

    // Delete original question if it's not in a thread
    if (!interaction.targetMessage.thread) {
      await interaction.targetMessage.delete();
    } else {
      // has thread - send message to thread
      await interaction.targetMessage.thread.send({
        content:
          '**This question has been moved to <#' +
          thread.id +
          '>**\n\n' +
          "Please continue the conversation there. Support messages outside of community help often get lost. We don't want that to happen to yours!",
      });
    }

    const followUpMessage = await interaction.followUp({
      content:
        '**<@' +
        interaction.targetMessage.author.id +
        '>' +
        ' - Your question has been moved to <#' +
        thread.id +
        '>**\n\n' +
        "Please continue the conversation there. Support messages outside of community help often get lost. We don't want that to happen to yours!",
    });

    // edit thread message to include link to followup
    await thread.messages.cache.first()?.edit({
      content:
        messageContent + attachmentStrings +
        '\n\n**Original message from <@' +
        interaction.targetMessage.author.id +
        '>' +
        ' - Moved from ' +
        followUpMessage.url + '**'
    });

    // get reaction message
    //const message = await interaction.channel.messages.fetch(interaction.replied as string);
    return;
  },
};

function hasPermission(commandExecutor: GuildMember): boolean {
  if (commandExecutor.permissions.has('ManageMessages')) {
    return true;
  }

  if (commandExecutor.roles.cache.find((role) => role.name.toLowerCase() === 'contributor mod')) {
    return true;
  }

  return false;
}
