import { Component } from '@angular/core';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sign-in-card',
  standalone: true,
  imports: [ CardComponent, FormsModule ],
  templateUrl: './sign-in-card.component.html',
  styleUrl: './sign-in-card.component.scss'
})
export class SignInCardComponent {
  signInData = {
    name: "",
    email: "",
    password: ""
  };
}
