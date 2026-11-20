<?php

use App\Http\Controllers\SchoolHomeController;
use Illuminate\Support\Facades\Route;

Route::get('/login', fn () => view('welcome'))->name('login');
Route::middleware('school')->get('/', SchoolHomeController::class)->name('school.home');
