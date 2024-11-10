import { Component, Input, OnInit } from '@angular/core';
import { PostInterface } from '../../interfaces/post.interface';
import { AuthorService } from '../../services/author.service.ts.service';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss'
})
export class MessageComponent implements OnInit{
  @Input() post: PostInterface = { text: '', author: '', timestamp: 0, thread: false, id: '' };
  authorName: string = '';

  constructor(private authorService: AuthorService) { }

  /**
   * Der OnInit-Hook ist nützlich, um eine Methode direkt nach der Initialisierung der Komponente auszuführen.
   */
  ngOnInit() {
    this.resolveAuthorName();
  }

  /**
   * Diese Methode verwendet den authorService, um den Namen basierend auf der ID abzurufen. Wenn der Name geladen ist, wird er der Variable
   */
  private resolveAuthorName() {
    this.authorService.getAuthorNameById(this.post.author).subscribe((name: string) => {
      this.authorName = name;
    });
  }

}
