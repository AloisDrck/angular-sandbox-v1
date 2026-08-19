export interface Project {
  id: string
  title: string
  description: string
  longDescription: string
  techs: string[]
  repoGit: string // github ou gitlab
  year: number
  type: 'academic' | 'professional' | 'personal'
}
