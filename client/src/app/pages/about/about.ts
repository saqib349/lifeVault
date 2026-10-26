import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  imports: [RouterLink],
  selector: 'app-about',
  styleUrl: './about.css',
  templateUrl: './about.html',
})
export class About {
  authService = inject(AuthService);

  readonly steps = [
    {
      title: 'Upload a receipt',
      text: 'Add a photo or PDF of a receipt, invoice or warranty card (JPG, PNG, WEBP or PDF).',
    },
    {
      title: 'AI reads it',
      text: 'Google Gemini fills in the item, merchant, price, purchase date and warranty details.',
    },
    {
      title: 'Review and save',
      text: 'Check the details, correct anything, and save. The original file stays attached.',
    },
  ];

  readonly features = [
    {
      title: 'My Vault',
      text: 'Search all your purchases and filter by category or warranty status.',
    },
    {
      title: 'Warranty tracking',
      text: 'See which warranties are active, expiring within 30 days, or expired.',
    },
    {
      title: 'AI Assistant',
      text: 'Ask in plain words, like "What did I buy last month?", and get matching receipts.',
    },
    {
      title: 'Private by default',
      text: 'Your receipts are linked to your account. Only you can view or download them.',
    },
  ];
}
