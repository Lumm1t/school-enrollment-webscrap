import Nightmare from 'nightmare'

interface Result {
  id: string
  schoolName: string
  score: string
}

const VULCAN = 'https://bydgoszcz.edu.com.pl/kandydat/app/statistics.html'

const wantedSchools = [
  'Branżowa Szkoła I stopnia nr 10 Mechaniczna w Bydgoszczy',
  'Technikum Mechaniczne nr 10 im. Franciszka Siemiradzkiego z Oddziałami Mistrzostwa Sportowego w Bydgoszczy',
  'Technikum Elektroniczne nr 7 im. Wojska Polskiego w Bydgoszczy',
  'Technikum Mechaniczno-Elektryczne nr 11 im. Tytusa Maksymiliana Hubera w Bydgoszczy',
  'Technikum Budowlane nr 3 im. Jurija Gagarina w Bydgoszczy',
  'Technikum nr 4 im. Ignacego Łukasiewicza w Bydgoszczy',
  'Technikum Ekonomiczne nr 6 w Bydgoszczy',
  'VI Liceum Ogólnokształcące im. Jana i Jędrzeja Śniadeckich w Bydgoszczy',
  'IV Liceum Ogólnokształcące im. Kazimierza Wielkiego w Bydgoszczy',
  'I Liceum Ogólnokształcące im. Cypriana Kamila Norwida z Oddziałami Dwujęzycznymi w Bydgoszczy',
]

export default class Browser {
  private readonly nightmare: Nightmare
  private schoolsResult: Result[] = []

  constructor(hide = false, options = {}) {
    this.nightmare = new Nightmare({
      show: !hide,
      ...options,
    })
  }

  async start(): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.nightmare.goto(VULCAN).then(resolve).catch(reject)
    })
  }

  async getSchools(): Promise<Result[]> {
    return new Promise((resolve, reject) => {
      this.nightmare
        // @ts-expect-error
        .evaluate((wantedSchools: string[]): Result[] => {
          const schoolSelect: HTMLSelectElement = document.querySelector(
            "select[id*='schoolSelect']"
          ) as HTMLSelectElement

          if (schoolSelect === null)
            throw new Error('There is no school select element!')

          // remove first option (-- dowolna --), filter results to only wanted schools, then return new array
          return [...schoolSelect]
            .slice(1)
            .filter((el: HTMLOptionElement) => wantedSchools.includes(el.text))
            .map((el: HTMLOptionElement) => ({
              id: el.value,
              schoolName: el.text,
              score: '-',
            }))
        }, wantedSchools)
        .then(resolve)
        .catch(reject)
    })
  }

  async schoolThread(): Promise<void> {
    this.schoolsResult = await this.getSchools()

    for (const school of this.schoolsResult) {
      await this.setSchool(school.id)

      school.score = await this.getScore()
    }
  }

  async setSchool(schoolID): Promise<void> {
    return new Promise((resolve, reject) => {
      this.nightmare
        .evaluate(() => document.querySelector('.summary')?.remove())
        .select("select[id*='schoolSelect']", schoolID)
        .click('input[value="Szukaj"]')
        .then(resolve)
        .catch(reject)
    })
  }

  async getScore(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.nightmare
        .wait(
          '.summary > td[data-label="Liczba chętnych z pierwszej preferencji"]'
        )
        .evaluate((): string => {
          const summary: HTMLSpanElement = document.querySelector(
            '.summary > td[data-label="Liczba chętnych z pierwszej preferencji"]'
          ) as HTMLSpanElement

          return summary.textContent?.trim() ?? '-'
        })
        .then(resolve)
        .catch(reject)
    })
  }

  output(): void {
    console.table(this.schoolsResult, ['schoolName', 'score'])

    void this.nightmare.end().then((resolve) => resolve)
  }
}
