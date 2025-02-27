import { Component, ElementRef, inject, Input, OnChanges, OnInit, OnDestroy, SimpleChanges } from '@angular/core';
import { PostInterface } from '../../interfaces/post.interface';
import { AuthorService } from '../../services/author.service';
import { UserInterface } from '../../interfaces/user.interface';
import { FirebaseStorageService } from '../../services/firebase-storage.service';
import { NgStyle } from '@angular/common';
import { EmojiSelectorComponent } from '../emoji-selector/emoji-selector.component';
import { EmojiService } from '@ctrl/ngx-emoji-mart/ngx-emoji';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CloudStorageService } from '../../services/cloud-storage.service';
import { Subscription } from 'rxjs';
import { SetMobileViewService, CurrentView } from '../../services/set-mobile-view.service';
import { InputfieldComponent } from "../inputfield/inputfield.component";


@Component({
  selector: 'app-message',
  standalone: true,
  imports: [NgStyle, EmojiSelectorComponent, InputfieldComponent],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss'
})
export class MessageComponent implements OnInit, OnChanges, OnDestroy {
  storage = inject(FirebaseStorageService);
  elementRef: ElementRef = inject(ElementRef);
  emojiSelector = inject(EmojiSelectorComponent);
  emoji = inject(EmojiService);
  sanitizer = inject(DomSanitizer);
  cloud = inject(CloudStorageService);
  private authorService: AuthorService = inject(AuthorService);
  private viewService: SetMobileViewService = inject(SetMobileViewService);

  isLargeScreen: boolean = false;

  @Input() post: PostInterface = { text: '', author: '', timestamp: 0, thread: false, id: '' };
  @Input() threadHead: boolean = false;
  @Input() origin: string = '';
  @Input() isThread: boolean = false;
  showEmojiSelector: boolean = false;
  showEmojiSelectorEdit: boolean = false;
  reactSelf: boolean = false;
  postEdit: boolean = false;
  isSpecialMenuOpen: boolean = false;

  isAuthorCurrentUser: boolean = false;

  private subscriptions: Subscription = new Subscription();

  constructor() { }


  /**
   * Lifecycle hook that is called after the component is initialized.
   * It resolves the author information from the post's author ID and updates the author status.
   */
  ngOnInit() {
    this.updateAuthorStatus();
    const screenSub = this.viewService.isLargeScreen$.subscribe(isLarge => {
      this.isLargeScreen = isLarge;
    });
    this.subscriptions.add(screenSub);
  }


  /**
   * Lifecycle hook that is called when any data-bound property of the component is changed.
   * If the changed property is the post, it resolves the author information from the post's author ID and updates the author status.
   * @param {SimpleChanges} changes - An object whose key is the property name and the value is the SimpleChange object.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['post']) {
      this.updateAuthorStatus();
    }
  }


  /**
   * Lifecycle hook that is called when the component is destroyed.
   * It unsubscribes from all active subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  /**
  * Updates the isAuthorCurrentUser property by comparing the post's author ID with the
  * current user's ID from the storage. This is used to determine if the author of the
  * post is the current user.
  */
  private updateAuthorStatus() {
    this.isAuthorCurrentUser = this.post.author === this.storage.currentUser?.id;
  }


  /**
   * Converts a timestamp to a localized string representing the time of day.
   * It uses the toLocaleTimeString() method of the Date object with the 'de-DE' locale
   * and the options { hour: '2-digit', minute: '2-digit' } to format the time as 'HH:mm'.
   *
   * @param {number} timestamp - The timestamp to convert.
   * @returns {string} The localized string representing the time of day.
   */
  postTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }


  /**
   * Converts the timestamp of the last message in the thread to a localized string representing the time of day.
   * It uses the toLocaleTimeString() method of the Date object with the 'de-DE' locale
   * and the options { hour: '2-digit', minute: '2-digit' } to format the time as 'HH:mm'.
   *
   * @returns {string} The localized string representing the time of day of the last message in the thread.
   */
  lastThreadMsgTime(): string {
    if (!this.post.threadMsg?.length) return '';
    const date = new Date(this.post.threadMsg[this.post.threadMsg.length - 1].timestamp);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }


  /**
   * Opens or closes the thread of the given post ID.
   * If the thread is currently open, it will be closed, and vice versa.
   * The post ID is stored in the currentUser object in the storage.
   * @param {string} postId - The ID of the post to open or close the thread of.
   */
  openThread(postId: string) {
    this.storage.currentUser.postId = postId;
    this.storage.currentUser.threadOpen = !this.storage.currentUser.threadOpen;
    this.viewService.setCurrentView('thread');
  }


  /**
   * Finds the name of the user with the given ID from the storage's user array.
   * If the user is found, their name is returned. Otherwise, an empty string is returned.
   * @param {string} id - The ID of the user whose name is to be found.
   * @returns {string} The name of the user if found, otherwise an empty string.
   */
  getUserName(id: string): string {
    const user = this.storage.user.find(user => user.id === id);
    if (user) return user.name;
    return '';
  }


  /**
   * Converts the given text to a trusted HTML string by bypassing Angular's
   * built-in sanitization of HTML content. This is useful for displaying
   * formatted text in a component, such as a message with styled text.
   *
   * @param {string} text - The text to be converted.
   * @returns {string} The trusted HTML string.
   */
  getText(text: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(text);
  }


  /**
   * Filters the given array of names by removing the current user's name, if it is present.
   * The function returns the name of the user at the given index, or 'Du' if the array is empty.
   * If the current user is present in the array, and the index points to the last element,
   * the function returns a string of the form 'User Name und Du', where 'User Name' is the name of the user at the index.
   * @param {string[]} names - The array of names to filter.
   * @param {number} index - The index of the name to return.
   * @returns {string} The name at the given index, or 'Du' if the array is empty, or a string of the form 'User Name und Du'.
   */
  filterEmoticonNameArray(names: string[], index: number): string | null {
    let newNames = [...names];
    this.reactSelf = false;
    let self = newNames.findIndex(name => name === this.storage.currentUser?.id);
    if (self !== -1) {
      newNames.splice(self, 1);
      this.reactSelf = true;
    }
    let newIndex = this.reactSelf ? index - 1 : index;
    if (newNames.length === 0) return 'Du';
    else if ((newNames.length - 1 === newIndex) && this.reactSelf) return this.getUserName(newNames[newIndex]) + ' und Du';
    else if (newIndex >= 0 && newIndex < newNames.length) return this.getUserName(newNames[newIndex]);
    else return null;
  }


  /**
   * Gets the last emoji the user selected. If the user has not selected any emoji
   * before, the default emoji '+1' is returned.
   * @returns The last emoji the user selected as an EmoticonsInterface object.
   */
  getLastEmoji() {
    let last = localStorage.getItem('emoji-mart.last') || '';
    let emojiObject = this.emoji.getData(last);
    if (emojiObject) return this.emoticonObject(emojiObject.native);
    else return this.emoticonObject(this.emoji.getData('+1')?.native);
  }


  /**
   * Retrieves the most frequently used emoji by the user, or a default emoji if no data is available.
   * The function checks the emojis stored in localStorage under 'emoji-mart.frequently' and 'emoji-mart.last'.
   * It first attempts to return the most frequently used emoji that is different from the last used emoji.
   * If the most used emoji is the same as the last used emoji, it returns the second most used emoji.
   * If neither of these is different from the last used emoji, a default 'clap' emoji is returned.
   * @returns The most recent or most frequently used emoji as an EmoticonsInterface object.
   */
  getMostRecentEmoji() {
    let recentEmojis = localStorage.getItem('emoji-mart.frequently') || '';
    let lastUsed = localStorage.getItem('emoji-mart.last') || '';
    let most = recentEmojis ? JSON.parse(recentEmojis) : '';
    if (!most) return this.emoticonObject(this.emoji.getData('clap')?.native);
    const allKeys = Object.keys(most);
    const mostUsed = allKeys.reduce((a, b) => most[a] > most[b] ? a : b);
    const secondMostUsed = allKeys.filter(key => key !== mostUsed).reduce((a, b) => most[a] > most[b] ? a : b);
    if (mostUsed !== lastUsed) return this.emoticonObject(this.emoji.getData(mostUsed)?.native);
    else if (secondMostUsed !== lastUsed) return this.emoticonObject(this.emoji.getData(secondMostUsed)?.native);
    else return this.emoticonObject(this.emoji.getData('clap')?.native);
  }


  /**
   * Returns an EmoticonsInterface object with the given emoticon.
   * @param {string | undefined} emoticon - The emoticon to create the object for.
   * @returns  An object with the given emoticon.
   */
  emoticonObject(emoticon: string | undefined) {
    return {
      'emoji':
      {
        'native': emoticon,
        'origin': this.origin,
        'isThread': this.isThread,
        'post': this.post,
        'isInput': false
      }
    }
  }


  /**
   * Sets the postEdit flag to true, and sets the isSpecialMenuOpen flag to false.
   * This is used to edit a post, and to close the special menu if it is open.
   */
  editPost() {
    this.postEdit = true;
    this.isSpecialMenuOpen = false;
  }


  /**
   * Toggles the visibility of the emoji selector for post editing.
   * If the emoji selector is visible, hides it, and if it is not visible, shows it.
   */
  toggleEmojiSelector() {
    this.showEmojiSelectorEdit = !this.showEmojiSelectorEdit;
  }


  /**
 * Handles clicks outside of the emoji selector component.
 * Stops the event from propagating and checks if the click target is outside the emoji selector.
 * If the target is outside, hides the emoji selector by setting the showEmojiSelector flag to false.
 * 
 * @param {MouseEvent} event - The event object representing the click.
 */
  outsideClick(event: any) {
    event.stopPropagation();
    const path = event.path || (event.composedPath && event.composedPath());
    if (!path.includes(this.elementRef.nativeElement.querySelector('app-emoji-selector'))) {
      this.showEmojiSelector = false;
    }
    if (!path.includes(this.elementRef.nativeElement.querySelector('special-container'))) {
      this.isSpecialMenuOpen = false;
    }
  }


  /**
   * Handels the click on thread-link and open the thread. If the mobile screen is shown, the view is set to thread.
   * 
   * @param {String} postId 
   */
  handleClick(postId: string) {
    this.openThread(postId)
    if (!this.isLargeScreen) {
      this.setView('thread');
      this.storage.currentUser.threadOpen = true;
    }
  }


  /**
   * Sets the view of workspace in mobile mode.
   * 
   * @param {String} view 'workspaceMenu' | 'channel' | 'thread'
   */
  setView(view: CurrentView): void {
    this.viewService.setCurrentView(view);
  }


  /**
   * Retrieves the name of the post's author based on the provided author ID.
   * Searches the user storage for a user with a matching ID.
   * If a user is found, their name is returned; otherwise, 'Unbekannt' is returned.
   * 
   * @param {string} postAuthor - The ID of the post author.
   * @returns {string} The name of the post author or 'Unbekannt' if not found.
   */
  postAuthor(postAuthor: string): string {
    let userName = this.storage.user.find(u => u.id === postAuthor);
    return userName ? userName.name : 'Gelöschter Nutzer';
  }


  /**
   * Retrieves the avatar of the post's author based on the provided author ID.
   * Searches the user storage for a user with a matching ID.
   * If a user is found, their avatar is returned; otherwise, 'profile-unknown' is returned.
   * 
   * @param {string} postAuthor - The ID of the post author.
   * @returns {string} The avatar of the post author or 'profile-unknown' if not found.
   */
  postAuthorAvatar(postAuthor: string): string {
    let avatar = this.storage.user.find(u => u.id === postAuthor);
    return avatar ? avatar.avatar : 'assets/img/profile-pictures/del-user.png';
  }
}
