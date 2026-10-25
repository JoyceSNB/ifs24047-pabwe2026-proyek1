import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { goto } from "$app/navigation";
import * as store from "../states/authStore";
import * as tools from "../../../helpers/toolsHelper";
import AuthPage from "./AuthPage.svelte";

vi.mock("../states/authStore");
vi.mock("../../../helpers/toolsHelper");
beforeEach(() => vi.resetAllMocks());

describe("AuthPage", () => {
  it("masuk: sukses lalu ke beranda", async () => {
    vi.mocked(store.login).mockResolvedValue({ ok: true, message: "", data: null });
    render(AuthPage, { mode: "login" });
    expect(screen.queryByLabelText("Nama")).toBeNull();
    await userEvent.type(screen.getByLabelText("Email"), "a@b.co");
    await userEvent.type(screen.getByLabelText("Password"), "123456");
    await userEvent.click(screen.getByRole("button", { name: "Masuk" }));
    await waitFor(() => expect(goto).toHaveBeenCalledWith("/"));
    expect(store.login).toHaveBeenCalledWith({ email: "a@b.co", password: "123456" });
    expect(screen.getByRole("link", { name: "Daftar" })).toHaveAttribute("href", "/auth/register");
  });

  it("masuk: gagal menampilkan pesan", async () => {
    vi.mocked(store.login).mockResolvedValue({ ok: false, message: "Email atau password salah", data: null });
    render(AuthPage, { mode: "login" });
    await userEvent.type(screen.getByLabelText("Email"), "a@b.co");
    await userEvent.type(screen.getByLabelText("Password"), "123456");
    await userEvent.click(screen.getByRole("button", { name: "Masuk" }));
    await waitFor(() => expect(tools.showErrorDialog).toHaveBeenCalledWith("Email atau password salah"));
    expect(goto).not.toHaveBeenCalled();
  });

  it("daftar: mengirim nama, email, password", async () => {
    vi.mocked(store.register).mockResolvedValue({ ok: true, message: "", data: null });
    render(AuthPage, { mode: "register" });
    await userEvent.type(screen.getByLabelText("Nama"), "Joyce");
    await userEvent.type(screen.getByLabelText("Email"), "j@b.co");
    await userEvent.type(screen.getByLabelText("Password"), "123456");
    await userEvent.click(screen.getByRole("button", { name: "Daftar" }));
    await waitFor(() => expect(store.register).toHaveBeenCalledWith({ name: "Joyce", email: "j@b.co", password: "123456" }));
    expect(screen.getByRole("link", { name: "Masuk" })).toHaveAttribute("href", "/auth/login");
  });

  it("login: id elemen dan autocomplete current-password", () => {
    render(AuthPage, { mode: "login" });
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("id", "username");
    expect(screen.getByLabelText("Password")).toHaveAttribute("id", "password");
    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "current-password");
    expect(screen.getByRole("button", { name: "Masuk" })).toHaveAttribute("id", "btn-submit");
  });

  it("daftar: id elemen dan autocomplete new-password", () => {
    render(AuthPage, { mode: "register" });
    expect(screen.getByLabelText("Nama")).toHaveAttribute("id", "register-name-input");
    expect(screen.getByLabelText("Email")).toHaveAttribute("id", "register-email-input");
    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByRole("button", { name: "Daftar" })).toHaveAttribute("id", "register-submit-button");
  });

  it("tombol menampilkan 'Memproses...' dan nonaktif saat mengirim", async () => {
    let done: (v: any) => void = () => {};
    vi.mocked(store.login).mockReturnValue(new Promise((r) => (done = r)));
    render(AuthPage, { mode: "login" });
    await userEvent.type(screen.getByLabelText("Email"), "a@b.co");
    await userEvent.type(screen.getByLabelText("Password"), "123456");
    await userEvent.click(screen.getByRole("button", { name: "Masuk" }));
    expect(await screen.findByRole("button", { name: "Memproses..." })).toBeDisabled();
    done({ ok: true, message: "", data: null });
    await waitFor(() => expect(goto).toHaveBeenCalledWith("/"));
  });
});