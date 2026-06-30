import { FCDS_SUBJECTS, DEPARTMENT_NAMES, FACULTY_ELECTIVES, PROGRAM_ELECTIVES } from './subjects';

export type Department = 'DS' | 'BA' | 'IS' | 'MA' | 'HI' | 'CS';
export type StudyLevel = 1 | 2 | 3 | 4;

export interface AcademicSubject {
  id: string;
  name: string;
  code: string;
}

export interface DepartmentData {
  name: string;
  levels: {
    [key in StudyLevel]: AcademicSubject[];
  };
}

// Helper function to generate a consistent ID
const generateSubjectId = (dept: string, level: number, name: string): string => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return `${dept.toLowerCase()}_${level}_${slug}`;
};

// Helper function to generate a placeholder code
const generateSubjectCode = (dept: string, level: number, index: number): string => {
  return `${dept.toUpperCase()}${level}${String(index + 1).padStart(2, '0')}`;
};

const buildAcademicData = (): Record<Department, DepartmentData> => {
  const data: Partial<Record<Department, DepartmentData>> = {};
  const departments: Department[] = ['DS', 'BA', 'IS', 'MA', 'HI', 'CS'];

  departments.forEach(dept => {
    data[dept] = {
      name: DEPARTMENT_NAMES[dept] || dept,
      levels: {
        1: [],
        2: [],
        3: [],
        4: []
      }
    };
  });

  // Iterate through FCDS_SUBJECTS to populate the data
  Object.entries(FCDS_SUBJECTS).forEach(([levelStr, deptSubjects]) => {
    const level = parseInt(levelStr) as StudyLevel;
    
    Object.entries(deptSubjects).forEach(([deptKey, subjects]) => {
      const dept = deptKey as Department;
      
      if (data[dept]) {
        data[dept]!.levels[level] = subjects.map((subjectName, index) => ({
          id: generateSubjectId(dept, level, subjectName),
          name: subjectName,
          code: generateSubjectCode(dept, level, index)
        }));
      }
    });
  });

  return data as Record<Department, DepartmentData>;
};

export const ACADEMIC_DATA: Record<Department, DepartmentData> = buildAcademicData();

export const getSubjects = (specialization: Department, level: StudyLevel): AcademicSubject[] => {
  return ACADEMIC_DATA[specialization]?.levels[level] || [];
};

// Get all subjects for a specific specialization across all levels
export const getAllDepartmentSubjects = (specialization: Department): AcademicSubject[] => {
  const levels: StudyLevel[] = [1, 2, 3, 4];
  return levels.flatMap(level => getSubjects(specialization, level));
};

// Get faculty electives as AcademicSubject array
export const getFacultyElectives = (): AcademicSubject[] => {
  return FACULTY_ELECTIVES.map((name, index) => ({
    id: `faculty_elective_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    name,
    code: `FE${String(index + 1).padStart(2, '0')}`
  }));
};

// Get program electives for a specific specialization
export const getProgramElectives = (specialization: Department): AcademicSubject[] => {
  const electives = PROGRAM_ELECTIVES[specialization] || [];
  return electives.map((name, index) => ({
    id: `${specialization.toLowerCase()}_elective_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    name,
    code: `${specialization}E${String(index + 1).padStart(2, '0')}`
  }));
};
