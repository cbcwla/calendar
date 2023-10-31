export type Roles = {
  [name in string]: string[];
};

export type RawEvent = {
  title: string;
  tags: {
    activity: string;
    dept: string;
  };
  start: string;
  end: string;
  owners?: string[];
  details?: string;
  id: string;
};
