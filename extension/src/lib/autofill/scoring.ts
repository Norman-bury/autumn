/**
 * Heuristic scoring for field detection.
 *
 * Scores inputs based on multiple signals:
 * - autocomplete attribute (highest confidence)
 * - aria-label
 * - associated label text
 * - placeholder text
 * - name/id attributes (lowest - often obfuscated)
 */

import type { FieldType, FieldPattern, ScoredField } from './types';

/**
 * Score thresholds.
 */
export const SCORE_THRESHOLD = 30;

/**
 * Score weights for each signal type.
 */
export const SCORE_WEIGHTS = {
  autocomplete: 100,
  ariaLabel: 50,
  labelText: 60,
  placeholder: 40,
  name: 30,
  id: 20,
} as const;

/**
 * Field patterns for each supported field type.
 */
export const FIELD_PATTERNS: Record<FieldType, FieldPattern> = {
  first_name: {
    autocomplete: ['given-name', 'fname', 'firstname'],
    labelPatterns: [
      /\bfirst\s*name\b/i,
      /\bfname\b/i,
      /\bgiven\s*name\b/i,
      /^first$/i,
    ],
    placeholderPatterns: [/first\s*name/i, /e\.g\.\s*john/i, /^first$/i],
    namePatterns: [/first_?name/i, /fname/i, /given_?name/i],
    idPatterns: [/first_?name/i, /fname/i, /given_?name/i],
  },
  last_name: {
    autocomplete: ['family-name', 'lname', 'lastname', 'surname'],
    labelPatterns: [
      /\blast\s*name\b/i,
      /\blname\b/i,
      /\bsurname\b/i,
      /\bfamily\s*name\b/i,
      /^last$/i,
    ],
    placeholderPatterns: [
      /last\s*name/i,
      /surname/i,
      /e\.g\.\s*(doe|smith)/i,
      /^last$/i,
    ],
    namePatterns: [/last_?name/i, /lname/i, /surname/i, /family_?name/i],
    idPatterns: [/last_?name/i, /lname/i, /surname/i, /family_?name/i],
  },
  full_name: {
    autocomplete: ['name', 'full-name', 'fullname'],
    labelPatterns: [
      /\bfull\s*name\b/i,
      /\byour\s*name\b/i,
      /\bname\b/i,
      /\bapplicant\s*name\b/i,
      /\bcandidate\s*name\b/i,
      /姓名/,
      /应聘者.*姓名/,
      /候选人.*姓名/,
    ],
    placeholderPatterns: [
      /full\s*name/i,
      /your\s*name/i,
      /e\.g\.\s*john\s*doe/i,
      /enter\s*your\s*name/i,
      /请输入.*姓名/,
      /姓名/,
    ],
    namePatterns: [
      /full_?name/i,
      /applicant_?name/i,
      /candidate_?name/i,
      /user_?name/i,
      /^name$/i,
      /姓名/,
    ],
    idPatterns: [
      /full_?name/i,
      /applicant_?name/i,
      /candidate_?name/i,
      /user_?name/i,
      /姓名/,
    ],
  },
  email: {
    autocomplete: ['email', 'email-address'],
    labelPatterns: [
      /\bemail\b/i,
      /\be-?mail\s*address\b/i,
      /邮箱/i,
      /电子邮件/,
    ],
    placeholderPatterns: [
      /email/i,
      /e\.g\.\s*.*@/i,
      /name@example\.com/i,
      /邮箱/i,
    ],
    namePatterns: [/email/i, /e_?mail/i],
    idPatterns: [/email/i, /e_?mail/i],
  },
  phone: {
    autocomplete: ['tel', 'tel-national', 'phone', 'mobile'],
    labelPatterns: [
      /\bphone\b/i,
      /\bmobile\b/i,
      /\bcell\b/i,
      /\btelephone\b/i,
      /\bcontact\s*number\b/i,
      /手机/,
      /手机号/,
      /联系电话/,
      /电话/,
    ],
    placeholderPatterns: [
      /\(xxx\)/,
      /\(\d{3}\)/,
      /phone/i,
      /mobile/i,
      /\+1/i,
      /手机/,
      /电话/,
    ],
    namePatterns: [/phone/i, /mobile/i, /cell/i, /tel/i, /contact/i],
    idPatterns: [/phone/i, /mobile/i, /cell/i, /tel/i],
  },
  city: {
    autocomplete: ['address-level2', 'city', 'locality'],
    labelPatterns: [
      /\bcity\b/i,
      /\blocation\b/i,
      /\bcurrent\s*city\b/i,
      /现居城市/,
      /当前城市/,
      /所在城市/,
    ],
    placeholderPatterns: [
      /city/i,
      /现居城市/,
      /当前城市/,
      /e\.g\.\s*(new\s*york|san\s*francisco|london)/i,
    ],
    namePatterns: [/city/i, /locality/i],
    idPatterns: [/city/i, /locality/i],
  },
  country: {
    autocomplete: ['country', 'country-name', 'country-name-code'],
    labelPatterns: [/\bcountry\b/i, /\bnation\b/i, /国家/, /国籍/],
    placeholderPatterns: [/country/i, /select\s*country/i, /国家/, /国籍/],
    namePatterns: [/country/i, /nation/i],
    idPatterns: [/country/i, /nation/i],
  },
  linkedin_url: {
    autocomplete: ['url', 'linkedin'],
    labelPatterns: [
      /\blinkedin\b/i,
      /\blinked\s*in\b/i,
      /\blinkedin\s*(profile|url)\b/i,
    ],
    placeholderPatterns: [/linkedin/i, /linkedin\.com/i, /linked\.in/i],
    namePatterns: [/linkedin/i, /linked_?in/i, /li_profile/i, /li_url/i],
    idPatterns: [/linkedin/i, /linked_?in/i, /li_profile/i, /li_url/i],
  },
  github_url: {
    autocomplete: ['url', 'github'],
    labelPatterns: [/github/i, /代码仓库/i],
    placeholderPatterns: [/github/i, /github\.com/i],
    namePatterns: [/github/i, /git_?hub/i],
    idPatterns: [/github/i, /git_?hub/i],
  },
  portfolio_url: {
    autocomplete: ['url', 'portfolio', 'website'],
    labelPatterns: [
      /portfolio/i,
      /personal\s*website/i,
      /个人网站/i,
      /作品集/i,
    ],
    placeholderPatterns: [/portfolio/i, /website/i, /个人网站/i],
    namePatterns: [/portfolio/i, /website/i, /homepage/i],
    idPatterns: [/portfolio/i, /website/i, /homepage/i],
  },
  highest_degree: {
    autocomplete: [],
    labelPatterns: [
      /degree/i,
      /education\s*level/i,
      /最高学历/i,
      /学历/i,
      /学位/i,
    ],
    placeholderPatterns: [/degree/i, /最高学历/i, /学历/i, /本科|硕士|博士/],
    namePatterns: [/degree/i, /education/i, /edu_?level/i],
    idPatterns: [/degree/i, /education/i, /edu_?level/i],
  },
  current_school: {
    autocomplete: ['organization'],
    labelPatterns: [
      /school/i,
      /university/i,
      /college/i,
      /毕业院校/i,
      /学校/i,
      /院校/i,
    ],
    placeholderPatterns: [
      /school/i,
      /university/i,
      /毕业院校/i,
      /学校/i,
      /院校/i,
    ],
    namePatterns: [/school/i, /university/i, /college/i, /edu.*school/i],
    idPatterns: [/school/i, /university/i, /college/i, /edu.*school/i],
  },
  major: {
    autocomplete: [],
    labelPatterns: [/major/i, /field\s*of\s*study/i, /专业/i, /研究方向/i],
    placeholderPatterns: [
      /major/i,
      /field\s*of\s*study/i,
      /专业/i,
      /研究方向/i,
    ],
    namePatterns: [/major/i, /field.*study/i, /specialty/i],
    idPatterns: [/major/i, /field.*study/i, /specialty/i],
  },
  education_start_date: {
    autocomplete: [],
    labelPatterns: [
      /education.*start/i,
      /school.*start/i,
      /入学时间/i,
      /入学年月/i,
    ],
    placeholderPatterns: [/education.*start/i, /入学时间/i, /入学年月/i],
    namePatterns: [/edu.*start/i, /school.*start/i],
    idPatterns: [/edu.*start/i, /school.*start/i],
  },
  education_end_date: {
    autocomplete: [],
    labelPatterns: [/education.*end/i, /graduat/i, /毕业时间/i, /毕业年月/i],
    placeholderPatterns: [
      /education.*end/i,
      /graduat/i,
      /毕业时间/i,
      /毕业年月/i,
    ],
    namePatterns: [/edu.*end/i, /school.*end/i, /graduat/i],
    idPatterns: [/edu.*end/i, /school.*end/i, /graduat/i],
  },
  graduation_year: {
    autocomplete: [],
    labelPatterns: [/graduation/i, /毕业时间/i, /毕业年份/i, /届/],
    placeholderPatterns: [/graduation/i, /20\d{2}/, /毕业/],
    namePatterns: [/graduation/i, /graduate/i],
    idPatterns: [/graduation/i, /graduate/i],
  },
  target_roles: {
    autocomplete: [],
    labelPatterns: [/target\s*(role|position|job)/i, /期望职位/i, /目标岗位/i],
    placeholderPatterns: [/target/i, /期望职位/i, /目标岗位/i],
    namePatterns: [/target.*(role|position|job)/i, /desired.*(role|position)/i],
    idPatterns: [/target.*(role|position|job)/i, /desired.*(role|position)/i],
  },
  preferred_locations: {
    autocomplete: [],
    labelPatterns: [/preferred\s*location/i, /期望城市/i, /意向城市/i],
    placeholderPatterns: [/preferred\s*location/i, /期望城市/i, /意向城市/i],
    namePatterns: [/preferred.*location/i, /desired.*location/i],
    idPatterns: [/preferred.*location/i, /desired.*location/i],
  },
  expected_salary: {
    autocomplete: [],
    labelPatterns: [/expected\s*salary/i, /期望薪资/i, /薪资要求/i],
    placeholderPatterns: [/salary/i, /期望薪资/i],
    namePatterns: [/salary/i, /compensation/i],
    idPatterns: [/salary/i, /compensation/i],
  },
  work_authorization: {
    autocomplete: [],
    labelPatterns: [
      /work\s*authorization/i,
      /authorized\s*to\s*work/i,
      /legally\s*authorized/i,
      /工作(许可|资格|授权)/,
      /是否.*合法.*工作/,
    ],
    placeholderPatterns: [/work\s*authorization/i, /authorized\s*to\s*work/i],
    namePatterns: [/work.*auth/i, /authorized.*work/i, /legal.*work/i],
    idPatterns: [/work.*auth/i, /authorized.*work/i, /legal.*work/i],
  },
  requires_sponsorship: {
    autocomplete: [],
    labelPatterns: [
      /sponsorship/i,
      /visa\s*sponsor/i,
      /require.*sponsor/i,
      /签证.*(赞助|支持)/,
      /是否.*需要.*签证/,
    ],
    placeholderPatterns: [/sponsorship/i, /visa\s*sponsor/i],
    namePatterns: [/sponsor/i, /visa/i],
    idPatterns: [/sponsor/i, /visa/i],
  },
  relocation: {
    autocomplete: [],
    labelPatterns: [/relocat/i, /迁移/i, /异地/i, /工作地点.*接受/],
    placeholderPatterns: [/relocat/i, /迁移/i, /异地/i],
    namePatterns: [/relocat/i, /mobility/i],
    idPatterns: [/relocat/i, /mobility/i],
  },
  available_start_date: {
    autocomplete: [],
    labelPatterns: [
      /start\s*date/i,
      /available\s*(from|date)/i,
      /到岗时间/,
      /入职时间/,
    ],
    placeholderPatterns: [
      /start\s*date/i,
      /available/i,
      /到岗时间/,
      /入职时间/,
    ],
    namePatterns: [/start.*date/i, /available.*date/i, /onboard/i],
    idPatterns: [/start.*date/i, /available.*date/i, /onboard/i],
  },
  notice_period: {
    autocomplete: [],
    labelPatterns: [/notice\s*period/i, /离职周期/, /通知期/],
    placeholderPatterns: [/notice\s*period/i, /离职周期/, /通知期/],
    namePatterns: [/notice.*period/i],
    idPatterns: [/notice.*period/i],
  },
  employment_status: {
    autocomplete: [],
    labelPatterns: [
      /employment\s*status/i,
      /current\s*employment/i,
      /当前.*状态/,
      /在职状态/,
    ],
    placeholderPatterns: [/employment\s*status/i, /在职状态/],
    namePatterns: [/employment.*status/i, /current.*employment/i],
    idPatterns: [/employment.*status/i, /current.*employment/i],
  },
  voluntary_self_identification: {
    autocomplete: [],
    labelPatterns: [
      /voluntary\s*self/i,
      /self[-\s]*identification/i,
      /自愿.*身份/,
    ],
    placeholderPatterns: [/self[-\s]*identification/i],
    namePatterns: [/self.*ident/i, /eeo/i, /equal.*opportunity/i],
    idPatterns: [/self.*ident/i, /eeo/i, /equal.*opportunity/i],
  },
  gender: {
    autocomplete: ['sex', 'gender'],
    labelPatterns: [/\bgender\b/i, /\bsex\b/i, /性别/],
    placeholderPatterns: [/gender/i, /性别/],
    namePatterns: [/gender/i, /^sex$/i],
    idPatterns: [/gender/i, /^sex$/i],
  },
  race_ethnicity: {
    autocomplete: [],
    labelPatterns: [/race/i, /ethnicity/i, /民族/, /种族/],
    placeholderPatterns: [/race/i, /ethnicity/i, /民族/, /种族/],
    namePatterns: [/race/i, /ethnicity/i],
    idPatterns: [/race/i, /ethnicity/i],
  },
  veteran_status: {
    autocomplete: [],
    labelPatterns: [/veteran/i, /退伍军人/],
    placeholderPatterns: [/veteran/i, /退伍军人/],
    namePatterns: [/veteran/i],
    idPatterns: [/veteran/i],
  },
  disability_status: {
    autocomplete: [],
    labelPatterns: [/disability/i, /disabled/i, /残疾/],
    placeholderPatterns: [/disability/i, /disabled/i, /残疾/],
    namePatterns: [/disability/i, /disabled/i],
    idPatterns: [/disability/i, /disabled/i],
  },
  background_check: {
    autocomplete: [],
    labelPatterns: [/background\s*check/i, /criminal/i, /犯罪记录/, /背景调查/],
    placeholderPatterns: [/background\s*check/i, /criminal/i, /背景调查/],
    namePatterns: [/background.*check/i, /criminal/i],
    idPatterns: [/background.*check/i, /criminal/i],
  },
  non_compete: {
    autocomplete: [],
    labelPatterns: [/non[-\s]*compete/i, /竞业/, /竞业限制/],
    placeholderPatterns: [/non[-\s]*compete/i, /竞业/],
    namePatterns: [/non.*compete/i, /compete/i],
    idPatterns: [/non.*compete/i, /compete/i],
  },
  skills: {
    autocomplete: [],
    labelPatterns: [/skills?/i, /technical\s*skills?/i, /技能/i, /技术栈/i],
    placeholderPatterns: [/skills?/i, /技能/i, /技术栈/i],
    namePatterns: [/skills?/i, /tech_?stack/i],
    idPatterns: [/skills?/i, /tech_?stack/i],
  },
  self_summary: {
    autocomplete: [],
    labelPatterns: [
      /summary/i,
      /self\s*introduction/i,
      /自我介绍/i,
      /个人简介/i,
    ],
    placeholderPatterns: [/summary/i, /introduce/i, /自我介绍/i],
    namePatterns: [/summary/i, /introduction/i, /bio/i],
    idPatterns: [/summary/i, /introduction/i, /bio/i],
  },
};

/**
 * Check if a string matches any pattern in the array.
 */
function matchesPatterns(value: string | null, patterns: RegExp[]): boolean {
  if (!value) return false;
  return patterns.some((pattern) => pattern.test(value));
}

/**
 * Get associated label text for an input element.
 */
function getAssociatedLabelText(
  element: HTMLInputElement | HTMLTextAreaElement
): string | null {
  // Check for explicit label association via for attribute
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent?.trim() || null;
  }

  // Check for implicit label (input inside label)
  const parentLabel = element.closest('label');
  if (parentLabel) {
    // Get label text excluding the input's value
    const text = parentLabel.textContent?.replace(element.value, '').trim();
    if (text) return text;
  }

  // Check for aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy);
    if (labelElement) return labelElement.textContent?.trim() || null;
  }

  // Check for adjacent label (sibling)
  const parent = element.parentElement;
  if (parent) {
    const label = parent.querySelector('label');
    if (label) return label.textContent?.trim() || null;
  }

  return null;
}

/**
 * Calculate score for a single field type.
 */
export function calculateFieldTypeScore(
  element: HTMLInputElement | HTMLTextAreaElement,
  fieldType: FieldType
): number {
  const patterns = FIELD_PATTERNS[fieldType];
  let score = 0;

  // Autocomplete attribute (highest confidence)
  const autocomplete = element.getAttribute('autocomplete');
  if (autocomplete && patterns.autocomplete.includes(autocomplete)) {
    score += SCORE_WEIGHTS.autocomplete;
  }

  // ARIA label
  const ariaLabel = element.getAttribute('aria-label');
  if (matchesPatterns(ariaLabel, patterns.labelPatterns)) {
    score += SCORE_WEIGHTS.ariaLabel;
  }

  // Associated label text
  const labelText = getAssociatedLabelText(element);
  if (matchesPatterns(labelText, patterns.labelPatterns)) {
    score += SCORE_WEIGHTS.labelText;
  }

  // Placeholder text
  if (matchesPatterns(element.placeholder, patterns.placeholderPatterns)) {
    score += SCORE_WEIGHTS.placeholder;
  }

  // Name attribute
  if (matchesPatterns(element.name, patterns.namePatterns)) {
    score += SCORE_WEIGHTS.name;
  }

  // ID attribute
  if (matchesPatterns(element.id, patterns.idPatterns)) {
    score += SCORE_WEIGHTS.id;
  }

  return score;
}

/**
 * Score a field and determine its best matching type.
 */
export function scoreField(
  element: HTMLInputElement | HTMLTextAreaElement
): ScoredField | null {
  // Skip non-text inputs (except email and tel)
  const validTypes = ['text', 'email', 'tel', 'url', ''];
  const inputType = (element as HTMLInputElement).type?.toLowerCase();
  if (inputType && !validTypes.includes(inputType)) {
    return null;
  }

  // Skip disabled or readonly
  if (element.disabled || element.readOnly) {
    return null;
  }

  // Skip hidden
  if (element.type === 'hidden') {
    return null;
  }

  // Skip invisible
  if (element.offsetWidth === 0 && element.offsetHeight === 0) {
    return null;
  }

  // Find best matching field type
  let bestFieldType: FieldType | null = null;
  let bestScore = 0;

  for (const fieldType of Object.keys(FIELD_PATTERNS) as FieldType[]) {
    const score = calculateFieldTypeScore(element, fieldType);
    if (score > bestScore) {
      bestScore = score;
      bestFieldType = fieldType;
    }
  }

  if (!bestFieldType || bestScore < SCORE_THRESHOLD) {
    return null;
  }

  return {
    element,
    fieldType: bestFieldType,
    score: bestScore,
  };
}
