import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

type LegalPage = 'privacy' | 'terms';

@Component({
  imports: [RouterLink],
  selector: 'app-legal',
  styleUrl: './legal.css',
  templateUrl: './legal.html',
})
export class Legal {
  private route = inject(ActivatedRoute);

  page = toSignal(
    this.route.data.pipe(map(data => data['page'] as LegalPage)),
    { initialValue: 'privacy' as LegalPage }
  );

  readonly lastUpdated = 'October 2026';
}
