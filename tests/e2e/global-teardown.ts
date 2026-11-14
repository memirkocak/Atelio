import { deleteTestUsers } from "./helpers/test-users";

export default async function globalTeardown() {
  await deleteTestUsers();
}
