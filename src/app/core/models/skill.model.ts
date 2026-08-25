export interface Skill {
  id: string
  name: string
  category: 'backend' | 'frontend' | 'devops' | 'data'
  level: 1 | 2 | 3 | 4 | 5
}
