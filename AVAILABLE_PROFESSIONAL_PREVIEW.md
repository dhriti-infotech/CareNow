# CareNow Available Professional Preview

Patient flow:

1. Patient completes Nurse at Home request.
2. Backend creates the request but does not offer it to nurses.
3. `available-professionals` screen loads all currently eligible nearby professionals.
4. Cards show name, profession, age, experience, rating, distance and price.
5. Patient cannot select a card.
6. Patient taps Continue.
7. Existing matching algorithm starts and offers the request to eligible nurses.
8. Existing request-status flow continues. Once a nurse accepts, the patient opens the existing live nurse tracking screen.

Distance pricing is calculated by the backend, not trusted from the mobile client.
