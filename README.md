# FunkySeats v4

FunkySeats er et bestillingssystem som lar kandidater reservere ledige seter på kontoret.
V4 er bygget med hovedsaklig Node.js og React.

Funksjoner:

Kandidater kan bla gjennom tilgjengelige seter og reservere dem for spesifikke datoer og tider, men ikke lengere enn 7 dager frem i tid med mindre man avtaler det.

Admin dashbord for å administrere setetilgjengelighet og reservasjoner.
Seat map med drag and drop funksjonalitet for admin.

Knapper/tabs for dato
----
### Mål

* **Representere de nye lokalene:** Oppdatere bookingsystemet slik at det gir et nøyaktig bilde av de nye fysiske lokalene, i motsetning til det gamle systemet som kun var tilpasset de forrige rommene.
* **Visuell oversikt (Seats-map):** Introdusere et interaktivt og levende setekart slik at brukere enkelt kan se og velge nøyaktige plasser i rommene.
* **Tydelig kontekst og UI:** Forbedre brukeropplevelsen (UX) ved å fjerne tvetydigheter, slik at det blir intuitivt å forstå meningen bak de ulike elementene i brukergrensesnittet.
* **Forbedret profilside:** Gjøre profilsiden mer omfattende ved å utvide den utover en enkel ukeskalender, slik at den inkluderer mer utfyllende statistikk og status over reservasjoner.
* **Fungerende hjelpesider:** Sørge for at FAQ-seksjonen blir fullt operativ og viser nyttig informasjon til brukerne.

### Endringer

* **Arkitekturskifte mot fullstack JavaScript:** Systemet beveger seg bort fra Laravel MVC-modellen, hvor backend rendret HTML på serversiden. Til en dynamisk Node.js- og React-stack.
* **Dynamisk klientside-rendring:** Grensesnittet blir mer drevet av React og JavaScript, som oppdaterer UI-en uten behov for full sideinnlasting.
* **Nytt visuelt setekart (Seats-map):** Legger inn nytt setekart for rommene.
* **Utvidet profil og statistikk:** Går bort fra begrensningen på kun én ukes visning på profilsiden til et grensesnitt som viser mer helhetlig historikk og statistikk.

### Funksjoner

* **Interaktivt setekart (Seats-map):** En visuell modul der brukere kan se romoppsettet og trykke på setet de ønsker.
* **Fleksibel plassbooking:** Mulighet å velge mellom 3 ulike rom, spesifisere behov for PC-tilgang eller kun ren arbeidsplass, samt velge mellom halv eller hel arbeidsdag.
* **Google Auth-integrasjon:** Sikker autentisering, pålogging og sesjonshåndtering for alle brukerene.
* **Admin-dashbord:** Sentralisert panel for IT-administratorer for å administrere setetilgjengelighet, rom og reservasjoner for brukere.
* **Integrert FAQ-seksjon:** En utfylt og fungerende hjelpeside som gir umiddelbare svar på vanlige spørsmål direkte i systemet.

### Begrunnelse

* **Minimerer opplæringstid:** Node.js og React ble valgt fordi det er god erfaring med denne stakken. Dette minimerer opplæringstiden og øker utviklingshastigheten betraktelig.
* **Kostnadseffektivt for enkle systemer:** Siden bookingsystemet er relativt enkelt og ikke krever tung CPU-databehandling hvor Django/Python ville briljert, eller ekstrem bedriftsskalering og sikkerhet hvor Spring Boot/C# er sterkest, er Node.js det mest hensiktsmessige valget akkurat nå.
* **Høy ytelse på samtidige tilkoblinger:** Node.js håndterer I/O-operasjoner og asynkrone forespørsler ekstremt raskt, noe som passer perfekt til systemets mål om å takle opptil 20 samtidige brukere.
* **Popularitet og relevans:** Stakken er blant de mest populære og brukte i det norske jobbmarkedet, noe som sikrer at erfaringen brukere opparbeider seg har høy verdi.

----
### Installasjon
```@@ -49,13 +49,10 @@ Knapper/tabs for dato```
- npm install 
- Klone repositoryet: ```git clone [https://github.com/FunkWeb/funkyseats4.git](https://github.com/FunkWeb/funkyseats4.git)```
- Naviger til prosjektmappen: ```cd funkyseats```
- Installer avhengigheter: ```composer install```
- Kopier ```.env.example``` filen til ```.env```: ```cp .env.example .env```
- Sett opp tilkoblingen til databasen i ```.env``` filen
- Kjør migreringer for å opprette nødvendige databasetabeller: ```migrate```

### Lisens

Kommer snart...
