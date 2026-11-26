<?php
namespace App\Services;
use Illuminate\Support\Facades\Http;
class RphAiAssistant {
    public function draft(array $input): array {
        $fallback=['objektif'=>"Murid dapat menerangkan {$input['topic']}.",'aktiviti'=>"Set induksi; penerangan; aktiviti kumpulan; pembentangan dan maklum balas.",'pentaksiran'=>'Pemerhatian, soal jawab dan semakan hasil kerja.','refleksi'=>'Murid membuat rumusan dan guru merancang tindakan susulan.','source'=>'deterministic-fallback'];
        $key=(string) config('services.deepseek.api_key'); if ($key==='' || strtolower($key)==='null') return $fallback;
        try { $response=Http::withToken($key)->acceptJson()->timeout(12)->post(rtrim(config('services.deepseek.base_url'),'/').'/chat/completions',['model'=>config('services.deepseek.model','deepseek-chat'),'temperature'=>0.1,'response_format'=>['type'=>'json_object'],'messages'=>[['role'=>'system','content'=>'Return JSON keys objektif, aktiviti, pentaksiran, refleksi only. Draft a concise Malay RPH.'],['role'=>'user','content'=>json_encode($input,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)]]]); $json=json_decode((string) data_get($response->json(),'choices.0.message.content'),true,512,JSON_THROW_ON_ERROR); return array_merge($fallback,array_intersect_key($json,$fallback),['source'=>'deepseek']); } catch (\Throwable) { return $fallback; }
    }
}
