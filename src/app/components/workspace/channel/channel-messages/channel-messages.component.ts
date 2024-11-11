import { Component, Input } from '@angular/core';
import { ChannelHeadComponent } from '../channel-head/channel-head.component';
import { MessageComponent } from '../../../../shared/components/message/message.component';
import { PostInterface } from '../../../../shared/interfaces/post.interface';
import { DateSeparatorComponent } from '../../../../shared/components/date-separator/date-separator.component';

@Component({
  selector: 'app-channel-messages',
  standalone: true,
  imports: [ChannelHeadComponent, MessageComponent, DateSeparatorComponent],
  templateUrl: './channel-messages.component.html',
  styleUrl: './channel-messages.component.scss'
})
export class ChannelMessagesComponent extends ChannelHeadComponent {
  @Input() post: PostInterface = { text: '', author: '', timestamp: 0, thread: false, id: '' };
  compareTimestamp: number = 0;

  constructor() {
    super();
  }

  /**
   * Vergleicht die Channel-IDs im Storage mit der ID in currentUser.currentChannel und 
   * speichert das posts-Array des zuerst gefundenen Channels in die Variable getPosts.
   * 
   * @returns {array}
   */
  getPostsofChannel() {
    let getPosts = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.posts;
    if (getPosts) return getPosts;
    else return [];
  }

  getPostsofDm() {
    let getPosts = this.storage.currentUser.dm.find(dm => dm.id === this.storage.currentUser.currentChannel)?.posts;
    if (getPosts) return getPosts;
    else return [];
  }

  trackByDate(post: PostInterface) {
    const date = new Date(post.timestamp);
    this.compareTimestamp = new Date(post.timestamp).setHours(0, 0, 0, 0);
    const formattedDate = date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return formattedDate;
  }

  currentDate(timestamp: number) {
    const date = new Date(timestamp);
    return new Date(date).setHours(0, 0, 0, 0);
  }

  resetCompareTimestamp() {
    this.compareTimestamp = 0;
  }
}
