<?php
namespace App\Http\Controllers;
use App\Models\CurriculumItem;
use App\Services\KpmDictionaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class LessonPlanAiController extends Controller
{
    public function generate(Request $request, KpmDictionaryService $dictionary): JsonResponse
    {
        $data = $request->validate(['school_type'=>['required','string','max:20'],'grade_level'=>['required','string','max:40'],'subject'=>['required','string','max:120'],'curriculum_item_id'=>['nullable','integer']]);
        $item=CurriculumItem::withoutGlobalScopes()->whereKey($data['curriculum_item_id']??0)->where('is_active',true)->first(); $title=$item?->title?:$data['subject'];
        $values=fn(string $key,string $fallback):string=>implode(', ',array_slice($dictionary->get($key),0,3))?:$fallback;
        return response()->json(['data'=>['objektif'=>"Murid dapat menerangkan dan mengaplikasikan {$title} dalam aktiviti pembelajaran.",'kriteria_kejayaan'=>'Murid dapat menyelesaikan tugasan dengan tepat dan memberi justifikasi ringkas.','aktiviti_utama'=>"Set induksi berkaitan {$title}; penerangan guru; aktiviti pasangan/kumpulan; pembentangan dan maklum balas.",'aktiviti_penutup'=>'Murid membuat rumusan dan menjawab soalan exit ticket.','bbm'=>'Buku teks, lembaran kerja dan bahan digital.','emk'=>$values('emk','Bahasa, TMK'),'nilai_murni'=>$values('nilai_murni','Kerjasama, bertanggungjawab'),'kbat'=>$values('kbat','Menganalisis, mencipta'),'pbd'=>'Pemerhatian, soal jawab dan semakan hasil kerja.','refleksi'=>'Sebahagian besar murid mencapai objektif; tindakan susulan dirancang untuk murid yang memerlukan bimbingan.','metadata'=>['school_type'=>$data['school_type'],'grade_level'=>$data['grade_level'],'subject'=>$data['subject'],'curriculum_item_id'=>$item?->id,'source'=>'kpm-template']]]);
    }
}
